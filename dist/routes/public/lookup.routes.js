"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const lookup_controller_1 = __importDefault(require("../../controllers/lookup/lookup.controller"));
const auth_middleware_1 = require("../../middleware/auth.middleware");
const router = (0, express_1.Router)();
// Allow any authenticated user to access lookups
router.use((0, auth_middleware_1.authMiddleware)(["ADMIN", "AGENT", "VENDOR"]));
router.get("/vendors", lookup_controller_1.default.getVendors);
router.get("/partners", lookup_controller_1.default.getPartners);
router.get("/vehicle-types", lookup_controller_1.default.getVehicleTypes);
exports.default = router;
