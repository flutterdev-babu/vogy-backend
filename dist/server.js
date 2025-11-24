"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const auth_routes_1 = __importDefault(require("./routes/auth/auth.routes"));
const admin_routes_1 = __importDefault(require("./routes/admin/admin.routes"));
const user_routes_1 = __importDefault(require("./routes/user/user.routes"));
const user_ride_routes_1 = __importDefault(require("./routes/ride/user.ride.routes"));
const rider_ride_routes_1 = __importDefault(require("./routes/ride/rider.ride.routes"));
const public_routes_1 = __importDefault(require("./routes/ride/public.routes"));
dotenv_1.default.config();
const app = (0, express_1.default)();
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Routes
// User and Rider authentication routes
app.use("/api/auth", auth_routes_1.default);
// Admin routes (includes auth and management - auth routes are public, management routes require auth)
app.use("/api/admin", admin_routes_1.default);
// User profile routes (protected - requires USER authentication)
app.use("/api/user", user_routes_1.default);
// User ride routes (protected - requires USER authentication)
app.use("/api/user/rides", user_ride_routes_1.default);
// Rider ride routes (protected - requires RIDER authentication)
app.use("/api/rider/rides", rider_ride_routes_1.default);
// Public ride routes (no authentication required)
app.use("/api/rides", public_routes_1.default);
// Health check
app.get("/", (req, res) => {
    res.send("API is running...");
});
// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
