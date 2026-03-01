import express, { Request, Response } from "express";
import http from "http";
import cors from "cors";
import dotenv from "dotenv";

// Load environment variables before any other imports
dotenv.config();

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
import rideRoutes from "./routes/ride/ride.routes";

// Public routes
import cityRoutes from "./routes/public/city.routes";
import vehicleTypeRoutes from "./routes/public/vehicleType.routes";
import lookupRoutes from "./routes/public/lookup.routes";
import paymentRoutes from "./routes/payment/payment.routes";

import { initializeSocket } from "./config/socket";

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

// Common ride routes (validate coupon etc)
app.use("/api/ride", rideRoutes);

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

// Vehicle types
app.use("/api/vehicle-types", vehicleTypeRoutes);

// Lookups for forms
app.use("/api/lookup", lookupRoutes);

// Payment routes
app.use("/api/payment", paymentRoutes);

// Health check
app.get("/", (req: Request, res: Response) => {
  res.send("API is running...");
});

// Start Server
const PORT = process.env.PORT || 5000;

// Import startup utilities
import { fixAgentCustomIds } from "./utils/fixCustomIds";
import { migrateRidersToPartners } from "./utils/migrateRidersToPartners";

server.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT} with Socket.IO`);
  
  // Migrate legacy Riders to unified Partners
  await migrateRidersToPartners();

  // Fix any agents with missing or improper customIds
  await fixAgentCustomIds();
});
