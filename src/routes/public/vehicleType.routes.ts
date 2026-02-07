import { Router } from "express";
import vehicleTypeController from "../../controllers/vehicle/vehicleType.controller";
import { authMiddleware } from "../../middleware/auth.middleware";

const router = Router();

// Public: Get all vehicle types
router.get("/", vehicleTypeController.getAll);

// Protected: CRUD for Admin/Agent
router.use(authMiddleware(["ADMIN", "AGENT"]));
router.post("/", vehicleTypeController.create);
router.get("/:id", vehicleTypeController.getById);
router.put("/:id", vehicleTypeController.update);
router.patch("/:id", vehicleTypeController.update);
router.delete("/:id", vehicleTypeController.delete);

export default router;
