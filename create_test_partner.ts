import { prisma } from "./src/config/prisma";
import bcrypt from "bcryptjs";

async function main() {
    const phone = "+919999999999";
    const email = "testpartner@vogy.com"; // Added unique email
    const password = "Password123!";
    const hashedPassword = await bcrypt.hash(password, 10);

    console.log("Creating/Updating test partner...");
    const partner = await prisma.partner.upsert({
        where: { phone },
        update: {
            password: hashedPassword,
            status: "APPROVED",
            email: email,
        },
        create: {
            name: "Test Partner",
            phone,
            email: email,
            password: hashedPassword,
            status: "APPROVED",
        },
    });

    console.log("✅ Test partner ready:", partner.phone);
}

main()
    .catch((err) => {
        console.error("❌ Error creating partner:", err);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
