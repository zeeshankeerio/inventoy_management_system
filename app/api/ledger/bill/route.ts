import { NextRequest, NextResponse } from "next/server";
import { 
  ledgerDb, 
  isUsingRealLedgerClient, 
  Bill,
  BillStatus, 
  BillType 
} from "@/app/lib/ledger-db";

/**
 * GET /api/ledger/bill
 * Get bills with optional filters
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Extract query parameters
    const khataId = searchParams.get("khataId");
    const partyId = searchParams.get("partyId");
    const billType = searchParams.get("billType") as BillType | null;
    const status = searchParams.get("status") as BillStatus | null;
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    
    // Pagination parameters
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "10");
    const skip = (page - 1) * pageSize;
    
    // Check if using real client
    if (isUsingRealLedgerClient) {
      // Build the where clause for filtering
      const where: any = {};
      
      if (khataId) {
        where.khataId = parseInt(khataId);
      }
      
      if (partyId) {
        where.partyId = parseInt(partyId);
      }
      
      if (billType) {
        where.billType = billType;
      }
      
      if (status) {
        where.status = status;
      }
      
      // Date filters
      if (startDate || endDate) {
        where.billDate = {};
        
        if (startDate) {
          where.billDate.gte = new Date(startDate);
        }
        
        if (endDate) {
          where.billDate.lte = new Date(endDate);
        }
      }
      
      // Get bills with pagination
      const [bills, totalCount] = await Promise.all([
        ledgerDb.bill.findMany({
          where,
          include: {
            party: true,
            transactions: true,
          },
          orderBy: {
            billDate: 'desc'
          },
          skip,
          take: pageSize,
        }),
        ledgerDb.bill.count({ where }),
      ]);
      
      // Format the response
      const formattedBills = bills.map((bill: Bill & { transactions?: any[] }) => ({
        id: bill.id,
        billNumber: bill.billNumber,
        khataId: bill.khataId,
        partyId: bill.partyId,
        partyName: bill.party?.name || null,
        billDate: bill.billDate.toISOString(),
        dueDate: bill.dueDate?.toISOString(),
        amount: bill.amount.toString(),
        paidAmount: bill.paidAmount.toString(),
        description: bill.description,
        billType: bill.billType,
        status: bill.status,
        transactions: bill.transactions?.map((tx: any) => ({
          id: tx.id,
          amount: tx.amount.toString(),
          date: tx.createdAt.toISOString(),
        })) || [],
        createdAt: bill.createdAt.toISOString(),
        updatedAt: bill.updatedAt.toISOString(),
      }));
      
      return NextResponse.json({
        bills: formattedBills,
        pagination: {
          total: totalCount,
          page,
          pageSize,
          totalPages: Math.ceil(totalCount / pageSize),
        }
      });
    } else {
      // Return mock data if not using real client
      const mockBills = [
        {
          id: 1,
          billNumber: "BILL-001",
          khataId: 1,
          partyId: 1,
          partyName: "Textile Suppliers Ltd",
          billDate: new Date().toISOString(),
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          amount: "25000",
          paidAmount: "0",
          description: "Thread Purchase",
          billType: "PURCHASE",
          status: "PENDING",
          transactions: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 2,
          billNumber: "BILL-002",
          khataId: 1,
          partyId: 2,
          partyName: "Fashion Retailer",
          billDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
          amount: "35000",
          paidAmount: "10000",
          description: "Cloth Sale",
          billType: "SALE",
          status: "PARTIAL",
          transactions: [
            {
              id: 1,
              amount: "10000",
              date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            }
          ],
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        }
      ];
      
      return NextResponse.json({
        bills: mockBills,
        pagination: {
          total: mockBills.length,
          page: 1,
          pageSize: 10,
          totalPages: 1,
        }
      });
    }
  } catch (error) {
    console.error("Error fetching bills:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch bills",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/ledger/bill
 * Create a new bill
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.khataId) {
      return NextResponse.json(
        { error: "Khata ID is required" },
        { status: 400 }
      );
    }
    
    if (!body.billType) {
      return NextResponse.json(
        { error: "Bill type is required" },
        { status: 400 }
      );
    }
    
    if (!body.amount || isNaN(parseFloat(body.amount)) || parseFloat(body.amount) <= 0) {
      return NextResponse.json(
        { error: "Valid amount is required" },
        { status: 400 }
      );
    }
    
    if (!body.billDate) {
      return NextResponse.json(
        { error: "Bill date is required" },
        { status: 400 }
      );
    }
    
    if (isUsingRealLedgerClient) {
      // Generate a bill number
      const billCount = await ledgerDb.bill.count({
        where: {
          khataId: parseInt(body.khataId),
        }
      });
      
      const billNumber = `BILL-${parseInt(body.khataId)}-${(billCount + 1).toString().padStart(4, '0')}`;
      
      // Create the bill
      const newBill = await ledgerDb.bill.create({
        data: {
          khataId: parseInt(body.khataId),
          partyId: body.partyId ? parseInt(body.partyId) : undefined,
          billNumber,
          billDate: new Date(body.billDate),
          dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
          amount: parseFloat(body.amount),
          paidAmount: 0,
          description: body.description?.trim() || null,
          billType: body.billType as BillType,
          status: BillStatus.PENDING,
        },
        include: {
          party: true,
        }
      });
      
      return NextResponse.json({
        bill: {
          id: newBill.id,
          billNumber: newBill.billNumber,
          khataId: newBill.khataId,
          partyId: newBill.partyId,
          partyName: newBill.party?.name || null,
          billDate: newBill.billDate.toISOString(),
          dueDate: newBill.dueDate?.toISOString(),
          amount: newBill.amount.toString(),
          paidAmount: newBill.paidAmount.toString(),
          description: newBill.description,
          billType: newBill.billType,
          status: newBill.status,
          transactions: [],
          createdAt: newBill.createdAt.toISOString(),
          updatedAt: newBill.updatedAt.toISOString(),
        }
      }, { status: 201 });
    } else {
      // Return mock data if not using real client
      return NextResponse.json({
        bill: {
          id: Math.floor(Math.random() * 1000) + 3,
          billNumber: `BILL-${Math.floor(Math.random() * 9000) + 1000}`,
          khataId: parseInt(body.khataId),
          partyId: body.partyId ? parseInt(body.partyId) : null,
          partyName: body.partyName || null,
          billDate: new Date(body.billDate).toISOString(),
          dueDate: body.dueDate ? new Date(body.dueDate).toISOString() : null,
          amount: body.amount,
          paidAmount: "0",
          description: body.description || null,
          billType: body.billType,
          status: "PENDING",
          transactions: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      }, { status: 201 });
    }
  } catch (error) {
    console.error("Error creating bill:", error);
    return NextResponse.json(
      {
        error: "Failed to create bill",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 