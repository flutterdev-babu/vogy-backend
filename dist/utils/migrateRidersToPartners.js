"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.migrateRidersToPartners = void 0;
const prisma_1 = require("../config/prisma");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
/**
 * Migration script to move data from legacy Rider model to unified Partner model.
 *
 * Steps:
 * 1. Read all Riders from the database.
 * 2. Create a Partner entry for each Rider (if not already exists).
 * 3. Update all Rides that referenced the Rider to now reference the Partner.
 */
const migrateRidersToPartners = async () => {
    console.log("🚀 Starting migration: Rider -> Partner");
    try {
        // 1. Get all riders
        // Use any because Rider might be removed from types soon
        const riders = await prisma_1.prisma.rider.findMany();
        console.log(`🔍 Found ${riders.length} riders to migrate.`);
        // 2. Rename 'riderId' field to 'partnerId' in Ride collection (Raw MongoDB command)
        // This handles rides that already existed.
        console.log("📝 Renaming 'riderId' field to 'partnerId' in Ride collection...");
        try {
            await prisma_1.prisma.$runCommandRaw({
                updateMany: "Ride",
                updates: [
                    {
                        q: { riderId: { $exists: true } },
                        u: { $rename: { riderId: "partnerId" } }
                    }
                ]
            });
            console.log("✅ Renamed fields in Ride collection.");
        }
        catch (err) {
            console.log(`⚠️  Rename field command failed or not applicable: ${err.message}`);
        }
        let migratedCount = 0;
        let errorCount = 0;
        for (const rider of riders) {
            try {
                // Check if partner with this phone already exists
                let partner = await prisma_1.prisma.partner.findUnique({
                    where: { phone: rider.phone },
                });
                if (!partner) {
                    console.log(`📝 Creating partner for rider: ${rider.name} (${rider.phone})`);
                    // Generate a temporary password (they will need to reset or use OTP)
                    const hashedPassword = await bcryptjs_1.default.hash("TemporaryPass123!", 10);
                    // Create partner from rider data
                    partner = await prisma_1.prisma.partner.create({
                        data: {
                            name: rider.name,
                            phone: rider.phone,
                            email: rider.email,
                            password: hashedPassword,
                            profileImage: rider.profileImage,
                            aadharNumber: rider.aadharNumber,
                            licenseNumber: rider.licenseNumber,
                            licenseImage: rider.licenseImage,
                            hasOwnVehicle: true,
                            ownVehicleNumber: rider.vehicleNumber,
                            ownVehicleModel: rider.vehicleModel,
                            ownVehicleTypeId: rider.vehicleTypeId,
                            status: "APPROVED",
                            isOnline: rider.isOnline,
                            currentLat: rider.currentLat,
                            currentLng: rider.currentLng,
                            rating: rider.rating,
                            totalEarnings: rider.totalEarnings,
                            createdAt: rider.createdAt,
                            updatedAt: rider.updatedAt,
                        },
                    });
                    // Update any rides that pointed to the OLD rider ID to point to the NEW partner ID
                    // (Only if the ID changed - in Prisma create it usually does unless specified)
                    if (partner.id !== rider.id) {
                        await prisma_1.prisma.ride.updateMany({
                            where: { partnerId: rider.id },
                            data: { partnerId: partner.id }
                        });
                    }
                }
                console.log(`✅ Migrated rider ${rider.name} to partner ${partner.id}`);
                migratedCount++;
            }
            catch (err) {
                console.error(`❌ Error migrating rider ${rider.id}:`, err.message);
                errorCount++;
            }
        }
        console.log(`🏁 Migration complete. Migrated: ${migratedCount}, Errors: ${errorCount}`);
    }
    catch (error) {
        console.error("❌ Critical error during migration:", error);
    }
};
exports.migrateRidersToPartners = migrateRidersToPartners;
