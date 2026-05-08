import { prisma } from "../src/config/prisma";

async function check() {
  try {
    const city = await prisma.cityCode.findFirst();
    if (!city) return;
    
    console.log("Checking for city:", city.code);
    
    const countWithRelation = await prisma.agent.count({
      where: { cityCode: { code: city.code } }
    });
    console.log("Count with relation:", countWithRelation);

    const countWithId = await prisma.agent.count({
      where: { cityCodeId: city.id }
    });
    console.log("Count with cityCodeId:", countWithId);

    const allAgents = await prisma.agent.findMany({
      where: { cityCodeId: city.id },
      select: { id: true, customId: true, cityCodeId: true }
    });
    console.log("Agents in this city:", allAgents.length);
    console.log(allAgents);

  } finally {
    await prisma.$disconnect();
  }
}

check();
