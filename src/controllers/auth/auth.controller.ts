import { Request, Response } from "express";
import {
  registerUser,
  registerRider,
  sendOtp,
  verifyOtp,
  registerAdmin,
  loginAdmin
} from "../../services/auth/auth.service";

export default {
  /* ============================================
      REGISTER USER
  ============================================ */
  registerUser: async (req: Request, res: Response) => {
    try {
      const user = await registerUser(req.body);
      return res.status(201).json({
        success: true,
        message: "User registered successfully",
        data: user,
      });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message });
    }
  },

  /* ============================================
      REGISTER RIDER
  ============================================ */
  registerRider: async (req: Request, res: Response) => {
    try {
      const rider = await registerRider(req.body);
      return res.status(201).json({
        success: true,
        message: "Rider registered successfully",
        data: rider,
      });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message });
    }
  },

  /* ============================================
      SEND OTP (Login Step 1)
  ============================================ */
  sendOtp: async (req: Request, res: Response) => {
    try {
      const { phone, role } = req.body;

      if (!phone || !role)
        return res
          .status(400)
          .json({ success: false, message: "Phone and role are required" });

      const response = await sendOtp(role, phone);

      return res.status(200).json({
        success: true,
        message: "OTP sent successfully",
        data: response,
      });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message });
    }
  },

  /* ============================================
      VERIFY OTP (Login Step 2)
  ============================================ */
  verifyOtp: async (req: Request, res: Response) => {
    try {
      const { phone, role, code } = req.body;

      if (!phone || !role || !code)
        return res.status(400).json({
          success: false,
          message: "Phone, role, and OTP code are required",
        });

      const response = await verifyOtp(role, phone, code);

      return res.status(200).json({
        success: true,
        message: "OTP verified successfully",
        data: response,
      });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message });
    }
  },

  /* ============================================
      REGISTER ADMIN
  ============================================ */
  registerAdmin: async (req: Request, res: Response) => {
    try {
      const { name, email, password, role } = req.body;

      if (!name || !email || !password) {
        return res.status(400).json({
          success: false,
          message: "Name, email, and password are required",
        });
      }

      const admin = await registerAdmin({ name, email, password, role });

      return res.status(201).json({
        success: true,
        message: "Admin registered successfully",
        data: admin,
      });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message });
    }
  },

  /* ============================================
      LOGIN ADMIN
  ============================================ */
  loginAdmin: async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: "Email and password are required",
        });
      }

      const response = await loginAdmin(email, password);

      return res.status(200).json({
        success: true,
        message: "Login successful",
        data: response,
      });
    } catch (error: any) {
      return res.status(401).json({ success: false, message: error.message });
    }
  },
};
