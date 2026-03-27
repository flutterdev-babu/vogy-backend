import { PartnerStatus } from "@prisma/client";

async function main() {
    console.log("PartnerStatus values:", Object.values(PartnerStatus));
}

main().catch(console.error);
