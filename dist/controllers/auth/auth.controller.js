"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const auth_service_1 = require("../../services/auth/auth.service");
exports.default = {
    /* ============================================
        REGISTER USER
    ============================================ */
    registerUser: async (req, res) => {
        try {
            const user = await (0, auth_service_1.registerUser)(req.body);
            return res.status(201).json({
                success: true,
                message: "User registered successfully",
                data: user,
            });
        }
        catch (error) {
            return res.status(400).json({ success: false, message: error.message });
        }
    },
    // Note: Partner registration is handled via partner.auth.service.ts
    // The old registerRider function has been removed - use Partner auth instead
    /* ============================================
        SEND OTP (Login Step 1)
    ============================================ */
    sendOtp: async (req, res) => {
        try {
            const { phone, role } = req.body;
            if (!phone || !role)
                return res
                    .status(400)
                    .json({ success: false, message: "Phone and role are required" });
            const response = await (0, auth_service_1.sendOtp)(role, phone);
            return res.status(200).json({
                success: true,
                message: "OTP sent successfully",
                data: response,
            });
        }
        catch (error) {
            return res.status(400).json({ success: false, message: error.message });
        }
    },
    /* ============================================
        VERIFY OTP (Login Step 2)
    ============================================ */
    verifyOtp: async (req, res) => {
        try {
            const { phone, role, code } = req.body;
            if (!phone || !role || !code)
                return res.status(400).json({
                    success: false,
                    message: "Phone, role, and OTP code are required",
                });
            const response = await (0, auth_service_1.verifyOtp)(role, phone, code);
            return res.status(200).json({
                success: true,
                message: "OTP verified successfully",
                data: response,
            });
        }
        catch (error) {
            return res.status(400).json({ success: false, message: error.message });
        }
    },
    /* ============================================
        REGISTER ADMIN
    ============================================ */
    registerAdmin: async (req, res) => {
        try {
            const { name, email, password, role, secretKey } = req.body;
            if (!name || !email || !password) {
                return res.status(400).json({
                    success: false,
                    message: "Name, email, and password are required",
                });
            }
            // Secure registration with secret key
            const adminSecret = process.env.ADMIN_REGISTRATION_SECRET;
            if (!secretKey || secretKey !== adminSecret) {
                return res.status(403).json({
                    success: false,
                    message: "Unauthorized: Invalid administration secret key",
                });
            }
            const admin = await (0, auth_service_1.registerAdmin)({ name, email, password, role });
            return res.status(201).json({
                success: true,
                message: "Admin registered successfully",
                data: admin,
            });
        }
        catch (error) {
            return res.status(400).json({ success: false, message: error.message });
        }
    },
    /* ============================================
        LOGIN ADMIN
    ============================================ */
    loginAdmin: async (req, res) => {
        try {
            const { email, password } = req.body;
            if (!email || !password) {
                return res.status(400).json({
                    success: false,
                    message: "Email and password are required",
                });
            }
            const response = await (0, auth_service_1.loginAdmin)(email, password);
            return res.status(200).json({
                success: true,
                message: "Login successful",
                data: response,
            });
        }
        catch (error) {
            return res.status(401).json({ success: false, message: error.message });
        }
    },
};
