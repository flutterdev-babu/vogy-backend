import { prisma } from "../src/config/prisma";

async function check() {
  try {
    const agents = await prisma.agent.findMany({
      select: { id: true, name: true, agentCode: true }
    });
    console.log("--- AGENTS ---");
    console.log(JSON.stringify(agents, null, 2));
    console.log("--------------");
  } finally {
    await prisma.$disconnect();
  }
}

check();
