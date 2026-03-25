const { PrismaClient } = require("@prisma/client");
const jwt = require("jsonwebtoken");

const prisma = new PrismaClient();
const JWT_SECRET = "myvogysecretkey";

async function main() {
  try {
    const admin = await prisma.admin.findFirst();
    if (!admin) {
      console.error("No admin found");
      process.exit(1);
    }

    const token = jwt.sign({ id: admin.id, role: "ADMIN" }, JWT_SECRET, { expiresIn: "7d" });
    console.log("---RESULT_START---");
    console.log("ADMIN_TOKEN=" + token);
    
    const city = await prisma.cityCode.findFirst({ where: { isActive: true } });
    const vehicle = await prisma.vehicleType.findFirst({ where: { isActive: true } });
    
    if (city && vehicle) {
      console.log("CITY_ID=" + city.id);
      console.log("VEHICLE_ID=" + vehicle.id);
    }
    console.log("---RESULT_END---");
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
