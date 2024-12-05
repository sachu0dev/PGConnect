import { PrismaClient } from "@prisma/client";

let prisma: PrismaClient;

if (process.env.NODE_ENV === "production") {
  prisma = new PrismaClient();
} else {
  // @ts-expect-error just ignore this
  if (!global.prisma) {
    // @ts-expect-error just ignore this
    global.prisma = new PrismaClient();
  }
  // @ts-expect-error just ignore this
  prisma = global.prisma;
}

export default prisma;
