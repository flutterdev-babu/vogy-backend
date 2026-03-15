"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const vehicleType_controller_1 = __importDefault(require("../../controllers/vehicle/vehicleType.controller"));
const auth_middleware_1 = require("../../middleware/auth.middleware");
const router = (0, express_1.Router)();
// Public: Get all vehicle types
router.get("/", vehicleType_controller_1.default.getAll);
// Protected: CRUD for Admin/Agent
router.use((0, auth_middleware_1.authMiddleware)(["ADMIN", "AGENT"]));
router.post("/", vehicleType_controller_1.default.create);
router.get("/:id", vehicleType_controller_1.default.getById);
router.put("/:id", vehicleType_controller_1.default.update);
router.patch("/:id", vehicleType_controller_1.default.update);
router.delete("/:id", vehicleType_controller_1.default.delete);
exports.default = router;
