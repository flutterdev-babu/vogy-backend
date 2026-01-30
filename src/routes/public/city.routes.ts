import { Router } from "express";
import cityController from "../../controllers/city/city.controller";

const router = Router();

// Get all active city codes (for signup forms)
router.get("/", cityController.getAllCityCodes);

export default router;
