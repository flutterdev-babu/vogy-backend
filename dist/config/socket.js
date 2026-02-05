"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.emitToRide = exports.emitToOnlineRiders = exports.emitToAdmins = exports.emitToRider = exports.emitToPartner = exports.emitToUser = exports.getIO = exports.initializeSocket = void 0;
const socket_io_1 = require("socket.io");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET = process.env.JWT_SECRET || "secret_jwt";
let io = null;
/**
 * Initialize Socket.IO server with authentication
 */
const initializeSocket = (server) => {
    io = new socket_io_1.Server(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"],
        },
    });
    // Authentication middleware
    io.use((socket, next) => {
        const token = socket.handshake.auth.token;
        if (!token) {
            return next(new Error("Authentication required"));
        }
        try {
            const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
            socket.userId = decoded.id;
            socket.userRole = decoded.role;
            next();
        }
        catch (error) {
            return next(new Error("Invalid token"));
        }
    });
    io.on("connection", (socket) => {
        console.log(`🔌 Socket connected: ${socket.id}, User: ${socket.userId}, Role: ${socket.userRole}`);
        // Join user to their personal room based on role
        if (socket.userId && socket.userRole) {
            if (socket.userRole === "USER") {
                socket.join(`user_${socket.userId}`);
                console.log(`👤 User ${socket.userId} joined room: user_${socket.userId}`);
            }
            else if (socket.userRole === "PARTNER" || socket.userRole === "RIDER") {
                socket.join(`partner_${socket.userId}`);
                socket.join(`rider_${socket.userId}`); // Keep for backward compatibility
                console.log(`🏍️ Partner ${socket.userId} joined rooms: partner_${socket.userId}, rider_${socket.userId}`);
            }
            else if (socket.userRole === "ADMIN") {
                socket.join("admin");
                console.log(`👨‍💼 Admin ${socket.userId} joined room: admin`);
            }
        }
        // Handle partner/rider location updates
        socket.on("location:update", (data) => {
            if ((socket.userRole === "PARTNER" || socket.userRole === "RIDER") && socket.userId) {
                // If there's an active ride, send location to the user
                if (data.rideId) {
                    // Emit to the ride-specific room
                    io?.to(`ride_${data.rideId}`).emit("partner:location", {
                        partnerId: socket.userId,
                        lat: data.lat,
                        lng: data.lng,
                        timestamp: new Date().toISOString(),
                    });
                    // Also emit rider:location for backward compatibility if needed
                    io?.to(`ride_${data.rideId}`).emit("rider:location", {
                        riderId: socket.userId,
                        lat: data.lat,
                        lng: data.lng,
                        timestamp: new Date().toISOString(),
                    });
                }
            }
        });
        // Handle partner/rider going online/offline
        socket.on("partner:online", () => {
            if ((socket.userRole === "PARTNER" || socket.userRole === "RIDER") && socket.userId) {
                socket.join("online_partners");
                socket.join("online_riders"); // Keep for backward compatibility
                console.log(`🟢 Partner ${socket.userId} is now online`);
            }
        });
        socket.on("rider:online", () => {
            if ((socket.userRole === "PARTNER" || socket.userRole === "RIDER") && socket.userId) {
                socket.join("online_partners");
                socket.join("online_riders");
                console.log(`🟢 Partner ${socket.userId} is now online via legacy event`);
            }
        });
        socket.on("partner:offline", () => {
            if ((socket.userRole === "PARTNER" || socket.userRole === "RIDER") && socket.userId) {
                socket.leave("online_partners");
                socket.leave("online_riders"); // Keep for backward compatibility
                console.log(`🔴 Partner ${socket.userId} is now offline`);
            }
        });
        socket.on("rider:offline", () => {
            if ((socket.userRole === "PARTNER" || socket.userRole === "RIDER") && socket.userId) {
                socket.leave("online_partners");
                socket.leave("online_riders");
                console.log(`🔴 Partner ${socket.userId} is now offline via legacy event`);
            }
        });
        // Join user to ride-specific room for real-time updates
        socket.on("ride:join", (rideId) => {
            socket.join(`ride_${rideId}`);
            console.log(`🚗 ${socket.userRole} ${socket.userId} joined ride room: ride_${rideId}`);
        });
        socket.on("ride:leave", (rideId) => {
            socket.leave(`ride_${rideId}`);
            console.log(`🚪 ${socket.userRole} ${socket.userId} left ride room: ride_${rideId}`);
        });
        socket.on("disconnect", () => {
            console.log(`❌ Socket disconnected: ${socket.id}`);
        });
    });
    console.log("🔌 Socket.IO initialized");
    return io;
};
exports.initializeSocket = initializeSocket;
/**
 * Get the Socket.IO instance
 */
const getIO = () => {
    return io;
};
exports.getIO = getIO;
/**
 * Emit event to a specific user
 */
const emitToUser = (userId, event, data) => {
    if (io) {
        io.to(`user_${userId}`).emit(event, data);
    }
};
exports.emitToUser = emitToUser;
/**
 * Emit event to a specific partner (renamed from emitToRider)
 */
const emitToPartner = (partnerId, event, data) => {
    if (io) {
        io.to(`partner_${partnerId}`).emit(event, data);
        io.to(`rider_${partnerId}`).emit(event, data); // Keep for backward compatibility
    }
};
exports.emitToPartner = emitToPartner;
/**
 * Backward compatibility alias
 */
exports.emitToRider = exports.emitToPartner;
/**
 * Emit event to all admins
 */
const emitToAdmins = (event, data) => {
    if (io) {
        io.to("admin").emit(event, data);
    }
};
exports.emitToAdmins = emitToAdmins;
/**
 * Emit event to all online riders
 */
const emitToOnlineRiders = (event, data) => {
    if (io) {
        io.to("online_riders").emit(event, data);
    }
};
exports.emitToOnlineRiders = emitToOnlineRiders;
/**
 * Emit event to a specific ride room
 */
const emitToRide = (rideId, event, data) => {
    if (io) {
        io.to(`ride_${rideId}`).emit(event, data);
    }
};
exports.emitToRide = emitToRide;
