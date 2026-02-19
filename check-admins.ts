import { prisma } from "./src/config/prisma";
import "dotenv/config";

async function checkAdmins() {
  try {
    const admins = await prisma.admin.findMany();
    console.log(`\n--- DATABASE ADMIN CHECK ---`);
    console.log(`Total Admins: ${admins.length}`);
    admins.forEach(a => {
      console.log(`Email: ${a.email}`);
      console.log(`Role: ${a.role}`);
      console.log(`ID: ${a.id}`);
      console.log(`-------------------------`);
    });
  } catch (error) {
    console.error("Error checking admins:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAdmins();
