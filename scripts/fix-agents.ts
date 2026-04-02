import { prisma } from "../src/config/prisma";

async function fixAgents() {
  console.log("🚀 Starting agent fix script...");

  const sureshId = "69a3c7933977466f6bb42da8";
  const saiId = "69be8987b18994c277d627d1";

  // City IDs
  const blrCityId = "6996ffbbd1e9c000a1297434"; // BLR
  const cbeCityId = "69b6c8a1fc0cd942bcccb11b"; // CBE

  try {
    // 1. Assign Suresh to BLR (Bangalore)
    console.log(`📝 Assigning Suresh to Bangalore (BLR)...`);
    await prisma.cityCode.update({
      where: { id: blrCityId },
      data: { agentId: sureshId }
    });

    // Also set primary cityCodeId
    await prisma.agent.update({
      where: { id: sureshId },
      data: { cityCodeId: blrCityId }
    });

    // 2. Assign Sai Bharadwaj to CBE (Coimbatore)
    console.log(`📝 Assigning Sai Bharadwaj to Coimbatore (CBE)...`);
    await prisma.cityCode.update({
      where: { id: cbeCityId },
      data: { agentId: saiId }
    });

    // Also set primary cityCodeId
    await prisma.agent.update({
      where: { id: saiId },
      data: { cityCodeId: cbeCityId }
    });

    console.log("✅ Agents fixed successfully!");
  } catch (error) {
    console.error("❌ Error fixing agents:", error);
  } finally {
    await prisma.$disconnect();
  }
}

fixAgents();
