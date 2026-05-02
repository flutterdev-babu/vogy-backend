
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Checking indexes on Partner collection...');
  
  // MongoDB specific: get indexes
  // Note: We use any because raw commands aren't strictly typed in the client
  try {
    const result = await (prisma as any).$runCommandRaw({
      listIndexes: "Partner"
    });
    
    console.log('Indexes for Partner:');
    console.dir(result.cursor.firstBatch, { depth: null });
    
    const uniqueIndex = result.cursor.firstBatch.find((idx: any) => 
      idx.key.vehicleId === 1 && idx.unique
    );
    
    if (uniqueIndex) {
      console.log('⚠️  FOUND UNIQUE INDEX ON vehicleId!');
    } else {
      console.log('✅ No unique index found on vehicleId.');
    }

  } catch (error) {
    console.error('Error fetching indexes:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
