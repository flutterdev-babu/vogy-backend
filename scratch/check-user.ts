
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const user = await prisma.user.findFirst({ where: { phone: '+917013988495' } });
  console.log('SEARCH_RESULT:', JSON.stringify(user, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
