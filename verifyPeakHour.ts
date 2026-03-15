import { getPeakHourAdjustment } from "./src/services/admin/peakHour.service";
import { prisma } from "./src/config/prisma";
import { DayOfWeek } from "@prisma/client";

async function verifyPeakHourLogic() {
  console.log("--- Starting Peak Hour Logic Verification ---");

  try {
    // 1. Setup Test Data
    const vehicleType = await prisma.vehicleType.findFirst({ where: { isActive: true } });
    const cityCode = await prisma.cityCode.findFirst({ where: { isActive: true } });

    if (!vehicleType || !cityCode) {
      console.log("Missing vehicle type or city code for testing. Skipping test.");
      return;
    }

    console.log(`Using Vehicle Type: ${vehicleType.name} (${vehicleType.id})`);
    console.log(`Using City Code: ${cityCode.code} (${cityCode.id})`);

    // 2. Create a Test Peak Hour Charge
    const testCharge = await prisma.peakHourCharge.create({
      data: {
        name: "Test Morning Peak",
        vehicleTypeId: vehicleType.id,
        cityCodeIds: [cityCode.id],
        days: [DayOfWeek.MONDAY, DayOfWeek.TUESDAY, DayOfWeek.WEDNESDAY, DayOfWeek.THURSDAY, DayOfWeek.FRIDAY],
        slots: [
          {
            startTime: "07:00",
            endTime: "10:00",
            fixedExtra: 50,
            percentageExtra: 10,
          }
        ]
      }
    });

    console.log("Created Test Peak Hour Charge");

    // 3. Test Cases
    
    // Case A: Within Peak Hour (Monday 8:00 AM)
    const mondayPeak = new Date();
    mondayPeak.setUTCFullYear(2026, 2, 16); // Monday, March 16, 2026 (assuming current month)
    mondayPeak.setUTCHours(8, 0, 0); 
    // Note: getPeakHourAdjustment uses local time in current implementation (new Date().getDay())
    // For testing, we'll manually set a date that we know is a specific day.
    
    const adj1 = await getPeakHourAdjustment(cityCode.id, vehicleType.id, mondayPeak);
    console.log(`Adjustment for Monday 08:00: Fixed=${adj1.fixedExtra}, Percentage=${adj1.percentageExtra}%`);
    if (adj1.fixedExtra === 50 && adj1.percentageExtra === 10) {
      console.log("✅ Case A Passed");
    } else {
      console.log("❌ Case A Failed");
    }

    // Case B: Outside Peak Hour (Monday 11:00 AM)
    const mondayOffPeak = new Date(mondayPeak);
    mondayOffPeak.setUTCHours(11, 0, 0);
    const adj2 = await getPeakHourAdjustment(cityCode.id, vehicleType.id, mondayOffPeak);
    console.log(`Adjustment for Monday 11:00: Fixed=${adj2.fixedExtra}, Percentage=${adj2.percentageExtra}%`);
    if (adj2.fixedExtra === 0 && adj2.percentageExtra === 0) {
      console.log("✅ Case B Passed");
    } else {
      console.log("❌ Case B Failed");
    }

    // Case C: Weekend (Sunday 8:00 AM) - Should not apply to this config
    const sundayPeak = new Date();
    sundayPeak.setUTCFullYear(2026, 2, 15); // Sunday, March 15, 2026
    sundayPeak.setUTCHours(8, 0, 0);
    const adj3 = await getPeakHourAdjustment(cityCode.id, vehicleType.id, sundayPeak);
    console.log(`Adjustment for Sunday 08:00: Fixed=${adj3.fixedExtra}, Percentage=${adj3.percentageExtra}%`);
    if (adj3.fixedExtra === 0 && adj3.percentageExtra === 0) {
      console.log("✅ Case C Passed");
    } else {
      console.log("❌ Case C Failed");
    }

    // 4. Cleanup
    await prisma.peakHourCharge.delete({ where: { id: testCharge.id } });
    console.log("Cleaned up test data");

  } catch (error) {
    console.error("Error during verification:", error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyPeakHourLogic();
