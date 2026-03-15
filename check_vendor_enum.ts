import { VendorStatus } from "@prisma/client";

async function main() {
    console.log("VendorStatus values:", Object.values(VendorStatus));
}

main().catch(console.error);
