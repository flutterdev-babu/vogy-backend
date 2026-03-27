import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();
const JWT_SECRET = "myvogysecretkey";

async function main() {
  const admin = await prisma.admin.findFirst();
  if (!admin) {
    console.error("No admin found");
    process.exit(1);
  }

  const token = jwt.sign({ id: admin.id, role: "ADMIN" }, JWT_SECRET, { expiresIn: "7d" });
  console.log("ADMIN_TOKEN=" + token);
  
  // Also get some valid data for the ride
  const city = await prisma.cityCode.findFirst();
  const vehicle = await prisma.vehicleType.findFirst();
  
  if (city && vehicle) {
    console.log("CITY_ID=" + city.id);
    console.log("VEHICLE_ID=" + vehicle.id);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
