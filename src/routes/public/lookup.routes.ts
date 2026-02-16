import { Router } from "express";
import lookupController from "../../controllers/lookup/lookup.controller";
import { authMiddleware } from "../../middleware/auth.middleware";

const router = Router();

// Allow any authenticated user to access lookups
router.use(authMiddleware(["ADMIN", "AGENT", "VENDOR"]));

router.get("/vendors", lookupController.getVendors);
router.get("/partners", lookupController.getPartners);
router.get("/vehicle-types", lookupController.getVehicleTypes);

export default router;
