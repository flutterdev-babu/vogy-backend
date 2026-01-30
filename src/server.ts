import express, { Request, Response } from "express";
import http from "http";
import cors from "cors";
import dotenv from "dotenv";

// Existing routes
import authRoutes from "./routes/auth/auth.routes";
import adminRoutes from "./routes/admin/admin.routes";
import userRoutes from "./routes/user/user.routes";
import userRideRoutes from "./routes/ride/user.ride.routes";
import riderRideRoutes from "./routes/ride/rider.ride.routes";
import publicRideRoutes from "./routes/ride/public.routes";

// New entity routes
import vendorRoutes from "./routes/vendor/vendor.routes";
import partnerRoutes from "./routes/partner/partner.routes";
import agentRoutes from "./routes/agent/agent.routes";
import corporateRoutes from "./routes/corporate/corporate.routes";

// Public routes
import cityRoutes from "./routes/public/city.routes";

import { initializeSocket } from "./config/socket";

dotenv.config();

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
initializeSocket(server);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============================================
// EXISTING ROUTES
// ============================================

// User and Rider authentication routes
app.use("/api/auth", authRoutes);

// Admin routes (includes auth and management - auth routes are public, management routes require auth)
app.use("/api/admin", adminRoutes);

// User profile routes (protected - requires USER authentication)
app.use("/api/user", userRoutes);

// User ride routes (protected - requires USER authentication)
app.use("/api/user/rides", userRideRoutes);

// Rider ride routes (protected - requires RIDER authentication)
app.use("/api/rider/rides", riderRideRoutes);

// Public ride routes (no authentication required)
app.use("/api/rides", publicRideRoutes);

// ============================================
// NEW ENTITY ROUTES
// ============================================

// Vendor routes (auth + profile + vehicles + rides)
app.use("/api/vendor", vendorRoutes);

// Partner routes (auth + profile + location + rides)
app.use("/api/partner", partnerRoutes);

// Agent routes (auth + profile + vendors + corporates)
app.use("/api/agent", agentRoutes);

// Corporate routes (auth + profile + rides + billing)
app.use("/api/corporate", corporateRoutes);

// ============================================
// PUBLIC ROUTES
// ============================================

// City codes (for signup forms - no auth required)
app.use("/api/city-codes", cityRoutes);

// Health check
app.get("/", (req: Request, res: Response) => {
  res.send("API is running...");
});

// Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT} with Socket.IO`));
