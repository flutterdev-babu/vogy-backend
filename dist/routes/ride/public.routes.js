"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = require("../../config/prisma");
const router = (0, express_1.Router)();
/* ===============================
        PUBLIC RIDE ROUTES
================================ */
// Get all active vehicle types (public - no auth required)
router.get("/vehicle-types", async (req, res) => {
    try {
        const vehicleTypes = await prisma_1.prisma.vehicleType.findMany({
            where: { isActive: true },
            select: {
                id: true,
                name: true,
                displayName: true,
                pricePerKm: true,
                isActive: true,
            },
            orderBy: { createdAt: "asc" },
        });
        return res.status(200).json({
            success: true,
            message: "Vehicle types retrieved successfully",
            data: vehicleTypes,
        });
    }
    catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message || "Failed to get vehicle types",
        });
    }
});
exports.default = router;
