import { prisma } from './src/config/prisma';
async function main() {
  try {
    const count = await (prisma as any).rider.count();
    console.log('Rider count:', count);
  } catch (e) {
    console.error('Error counting riders:', e);
  } finally {
    process.exit();
  }
}
main();
