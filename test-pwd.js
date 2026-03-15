const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const partners = await prisma.partner.findMany();
    const users = await prisma.user.findMany();
    
    console.log(`Total Partners: ${partners.length}`);
    partners.forEach(p => console.log(' - ' + p.phone + ' | ' + p.name));
    
    console.log(`Total Users: ${users.length}`);
    users.forEach(u => console.log(' - ' + u.phone + ' | ' + u.name));
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
