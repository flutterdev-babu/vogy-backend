import { prisma } from './src/config/prisma';
async function main() {
  try {
    const count = await prisma.agent.count();
    console.log('Agent count:', count);
  } catch (e) {
    console.error('Error counting agents:', e);
  } finally {
    process.exit();
  }
}
main();
