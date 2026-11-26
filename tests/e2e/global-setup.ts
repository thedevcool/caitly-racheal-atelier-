import { PrismaClient } from "@prisma/client";

/** Clear what earlier runs left behind, so the rate limits never trip on reruns. */
export default async function globalSetup() {
  const db = new PrismaClient();
  await db.enquiry.deleteMany({ where: { email: { endsWith: "@example.test" } } });
  await db.loginAttempt.deleteMany();
  await db.$disconnect();
}
