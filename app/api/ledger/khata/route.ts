import { NextRequest, NextResponse } from "next/server";
import { ledgerDb, Khata } from "@/app/lib/ledger-db";

/**
 * GET /api/ledger/khata
 * Get all khatas (account books)
 */
export async function GET(request: NextRequest) {
  try {
    // Get all khatas from the database
    const khatas = await ledgerDb.khata.findMany({
      orderBy: {
        name: 'asc'
      }
    });
    
    // If no khatas found, return a sample default khata
    if (!khatas || khatas.length === 0) {
      return NextResponse.json({
        khatas: [
          {
            id: 1,
            name: "Main Account Book",
            description: "Primary business khata",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ]
      });
    }
    
    return NextResponse.json({
      khatas: khatas.map((khata: Khata) => ({
        id: khata.id,
        name: khata.name,
        description: khata.description,
        createdAt: khata.createdAt.toISOString(),
        updatedAt: khata.updatedAt.toISOString()
      }))
    });
  } catch (error) {
    console.error("Error fetching khatas:", error);
    
    // Return a default khata to prevent UI issues
    return NextResponse.json({
      khatas: [
        {
          id: 1,
          name: "Main Account Book",
          description: "Primary business khata",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ],
      error: "Failed to fetch khatas, using default"
    });
  }
}

/**
 * POST /api/ledger/khata
 * Create a new khata (account book)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.name || body.name.trim() === "") {
      return NextResponse.json(
        { error: "Khata name is required" },
        { status: 400 }
      );
    }
    
    // Create a new khata in the database
    const newKhata = await ledgerDb.khata.create({
      data: {
        name: body.name.trim(),
        description: body.description?.trim() || null,
      }
    });
    
    return NextResponse.json({
      khata: {
        id: newKhata.id,
        name: newKhata.name,
        description: newKhata.description,
        createdAt: newKhata.createdAt.toISOString(),
        updatedAt: newKhata.updatedAt.toISOString()
      }
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating khata:", error);
    return NextResponse.json(
      {
        error: "Failed to create khata",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 