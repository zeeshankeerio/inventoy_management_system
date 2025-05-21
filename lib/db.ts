import { PrismaClient } from "@prisma/client";
import '../types/prismaTypes';

const createPrismaClient = () =>
    new PrismaClient({
        log:
            process.env.NODE_ENV === "development"
                ? ["warn", "error"]
                : ["error"],
    });

const globalForPrisma = globalThis as unknown as {
    prisma: ReturnType<typeof createPrismaClient> | undefined;
};

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
