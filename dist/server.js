"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
// Load environment variables before any other imports
dotenv_1.default.config();
// Existing routes
const auth_routes_1 = __importDefault(require("./routes/auth/auth.routes"));
const admin_routes_1 = __importDefault(require("./routes/admin/admin.routes"));
const user_routes_1 = __importDefault(require("./routes/user/user.routes"));
const user_ride_routes_1 = __importDefault(require("./routes/ride/user.ride.routes"));
const rider_ride_routes_1 = __importDefault(require("./routes/ride/rider.ride.routes"));
const public_routes_1 = __importDefault(require("./routes/ride/public.routes"));
// New entity routes
const vendor_routes_1 = __importDefault(require("./routes/vendor/vendor.routes"));
const partner_routes_1 = __importDefault(require("./routes/partner/partner.routes"));
const agent_routes_1 = __importDefault(require("./routes/agent/agent.routes"));
const corporate_routes_1 = __importDefault(require("./routes/corporate/corporate.routes"));
const ride_routes_1 = __importDefault(require("./routes/ride/ride.routes"));
// Public routes
const city_routes_1 = __importDefault(require("./routes/public/city.routes"));
const vehicleType_routes_1 = __importDefault(require("./routes/public/vehicleType.routes"));
const lookup_routes_1 = __importDefault(require("./routes/public/lookup.routes"));
const payment_routes_1 = __importDefault(require("./routes/payment/payment.routes"));
const socket_1 = require("./config/socket");
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
// Initialize Socket.IO
(0, socket_1.initializeSocket)(server);
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// ============================================
// EXISTING ROUTES
// ============================================
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
// Common ride routes (validate coupon etc)
app.use("/api/ride", ride_routes_1.default);
// ============================================
// NEW ENTITY ROUTES
// ============================================
// Vendor routes (auth + profile + vehicles + rides)
app.use("/api/vendor", vendor_routes_1.default);
// Partner routes (auth + profile + location + rides)
app.use("/api/partner", partner_routes_1.default);
// Agent routes (auth + profile + vendors + corporates)
app.use("/api/agent", agent_routes_1.default);
// Corporate routes (auth + profile + rides + billing)
app.use("/api/corporate", corporate_routes_1.default);
// ============================================
// PUBLIC ROUTES
// ============================================
// City codes (for signup forms - no auth required)
app.use("/api/city-codes", city_routes_1.default);
// Vehicle types
app.use("/api/vehicle-types", vehicleType_routes_1.default);
// Lookups for forms
app.use("/api/lookup", lookup_routes_1.default);
// Payment routes
app.use("/api/payment", payment_routes_1.default);
// Health check
app.get("/", (req, res) => {
    res.send("API is running...");
});
// Start Server
const PORT = process.env.PORT || 5000;
// Import startup utilities
const fixCustomIds_1 = require("./utils/fixCustomIds");
const migrateRidersToPartners_1 = require("./utils/migrateRidersToPartners");
server.listen(PORT, async () => {
    console.log(`🚀 Server running on port ${PORT} with Socket.IO`);
    // Migrate legacy Riders to unified Partners
    await (0, migrateRidersToPartners_1.migrateRidersToPartners)();
    // Fix any agents with missing or improper customIds
    await (0, fixCustomIds_1.fixAgentCustomIds)();
});
