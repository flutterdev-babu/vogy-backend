import { PrismaClient } from "@prisma/client";
import { generateUnique4DigitOtp } from "../src/utils/generateUniqueOtp";

const prisma = new PrismaClient();

/**
 * Migrate existing users to have unique OTPs
 */
async function migrateUserOtps() {
  try {
    console.log("Starting migration of user OTPs...");

    // Get all users
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        phone: true,
        uniqueOtp: true,
      },
    });
    
    console.log(`Total users in database: ${allUsers.length}`);
    
    // Filter users without uniqueOtp or with null/empty uniqueOtp
    const users = allUsers.filter(u => !u.uniqueOtp || u.uniqueOtp === null || u.uniqueOtp === "");

    if (users.length === 0) {
      console.log("✅ No users need migration. All users already have unique OTPs.");
      return;
    }

    console.log(`Found ${users.length} users without unique OTP that need migration`);

    console.log(`Found ${users.length} users without unique OTP`);

    // Generate and assign unique OTPs
    for (const user of users) {
      try {
        const uniqueOtp = await generateUnique4DigitOtp();
        
        await prisma.user.update({
          where: { id: user.id },
          data: { uniqueOtp },
        });

        console.log(`✓ Updated user ${user.id} (${user.name || user.phone}) with OTP: ${uniqueOtp}`);
      } catch (error: any) {
        console.error(`✗ Failed to update user ${user.id}:`, error.message);
      }
    }

    console.log(`\n✅ Migration completed! Updated ${users.length} users.`);
    
    // Verify no null values remain
    const remainingNulls = await prisma.user.count({
      where: {
        OR: [
          { uniqueOtp: null },
          { uniqueOtp: "" },
        ],
      },
    });

    if (remainingNulls === 0) {
      console.log("✅ All users now have unique OTPs. You can now make the field required in schema.");
    } else {
      console.log(`⚠️  Warning: ${remainingNulls} users still don't have unique OTPs.`);
    }
  } catch (error) {
    console.error("❌ Error during migration:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration
migrateUserOtps()
  .then(() => {
    console.log("Migration script finished successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Migration script failed:", error);
    process.exit(1);
  });
