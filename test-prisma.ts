import { prisma } from "./src/config/prisma";

async function test() {
  const vendors = await prisma.vendor.findMany({
    select: {
      id: true,
      agent: {
        select: {
          id: true,
          name: true,
        }
      }
    }
  });
  console.log(vendors);
}

test();
