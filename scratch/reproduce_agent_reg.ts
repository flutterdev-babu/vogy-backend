import { prisma } from "../src/config/prisma";
import { registerAgent } from "../src/services/auth/agent.auth.service";

async function test() {
  try {
    const city = await prisma.cityCode.findFirst();
    if (!city) {
      console.log("No city found, please create one first.");
      return;
    }
    console.log("Using city:", city.cityName, city.id);

    const data = {
      name: "Test Agent " + Date.now(),
      phone: "9" + Math.floor(Math.random() * 1000000000).toString().padStart(9, '0'),
      email: `test_agent_${Date.now()}@example.com`,
      password: "Password123",
      cityCodeId: city.id
    };

    console.log("Registering agent with data:", data);
    const agent = await registerAgent(data);
    console.log("Successfully registered agent:", agent.customId);
  } catch (err: any) {
    console.error("Registration failed with error:", err.message);
    if (err.code) console.error("Error code:", err.code);
    if (err.meta) console.error("Error meta:", err.meta);
  } finally {
    await prisma.$disconnect();
  }
}

test();
