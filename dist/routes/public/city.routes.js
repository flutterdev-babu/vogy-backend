"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const city_controller_1 = __importDefault(require("../../controllers/city/city.controller"));
const router = (0, express_1.Router)();
// Get all active city codes (for signup forms)
router.get("/", city_controller_1.default.getAllCityCodes);
exports.default = router;
