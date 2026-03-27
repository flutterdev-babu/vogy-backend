import { Router } from "express";
import enquiryController from "../../controllers/public/enquiry.controller";

const router = Router();

router.post("/", enquiryController.submitEnquiry);

export default router;
