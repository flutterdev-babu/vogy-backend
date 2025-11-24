import { Router } from "express";
import { prisma } from "../../config/prisma";

const router = Router();

/* ===============================
        PUBLIC RIDE ROUTES
================================ */

// Get all active vehicle types (public - no auth required)
router.get("/vehicle-types", async (req, res) => {
  try {
    const vehicleTypes = await prisma.vehicleType.findMany({
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
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message || "Failed to get vehicle types",
    });
  }
});

export default router;

