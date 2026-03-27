import { PrismaMariaDb } from "@prisma/adapter-mariadb";

const { PrismaClient } = require("@prisma/client");

const prismaClientSingleton = () => {
    const adapter = new PrismaMariaDb(process.env.DATABASE_URL ?? "");

    return new PrismaClient({ adapter });
}

declare global {
    var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>
}

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton()

export default prisma;

if (process.env.NODE_ENV !== "production") globalThis.prismaGlobal = prisma;

