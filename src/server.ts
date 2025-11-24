import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth/auth.routes";
import adminRoutes from "./routes/admin/admin.routes";
import userRoutes from "./routes/user/user.routes";
import userRideRoutes from "./routes/ride/user.ride.routes";
import riderRideRoutes from "./routes/ride/rider.ride.routes";
import publicRideRoutes from "./routes/ride/public.routes";

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
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

// Health check
app.get("/", (req: Request, res: Response) => {
  res.send("API is running...");
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
