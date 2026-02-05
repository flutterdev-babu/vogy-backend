"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fixAgentCustomIds = void 0;
const prisma_1 = require("../config/prisma");
const city_service_1 = require("../services/city/city.service");
/**
 * Validates if a customId follows the proper format: IC[PREFIX][CITYCODE][NUMBER]
 * Example: ICABLR01, ICABLR02
 */
const isValidCustomId = (customId, cityCode) => {
    if (!customId || !cityCode)
        return false;
    // Expected format: ICA + cityCode + digits (e.g., ICABLR01)
    const expectedPrefix = `ICA${cityCode}`;
    const regex = new RegExp(`^${expectedPrefix}\\d+$`);
    return regex.test(customId);
};
/**
 * Fixes agents with missing or improper customIds on server startup
 */
const fixAgentCustomIds = async () => {
    console.log("🔧 Checking agent customIds...");
    try {
        // Get all agents with their cityCode
        const agents = await prisma_1.prisma.agent.findMany({
            include: {
                cityCodes: true,
            },
        });
        let fixedCount = 0;
        for (const agent of agents) {
            // Get agent's primary city code (first one if multiple)
            const primaryCityCode = agent.cityCodes[0];
            if (!primaryCityCode) {
                console.log(`⚠️  Agent ${agent.name} (${agent.id}) has no city code assigned`);
                continue;
            }
            const cityCode = primaryCityCode.code;
            // Check if customId is missing or invalid
            if (!agent.customId || !isValidCustomId(agent.customId, cityCode)) {
                console.log(`🔄 Fixing customId for agent: ${agent.name} (old: ${agent.customId || 'none'})`);
                // Generate new proper customId
                const newCustomId = await (0, city_service_1.generateEntityCustomId)(cityCode, "AGENT");
                // Update agent with new customId
                await prisma_1.prisma.agent.update({
                    where: { id: agent.id },
                    data: { customId: newCustomId },
                });
                console.log(`✅ Updated agent ${agent.name}: ${newCustomId}`);
                fixedCount++;
            }
        }
        if (fixedCount > 0) {
            console.log(`🎉 Fixed ${fixedCount} agent customId(s)`);
        }
        else {
            console.log("✅ All agent customIds are valid");
        }
    }
    catch (error) {
        console.error("❌ Error fixing agent customIds:", error);
    }
};
exports.fixAgentCustomIds = fixAgentCustomIds;
