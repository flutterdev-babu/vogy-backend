import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "secret_jwt";

let io: Server | null = null;

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userRole?: string;
}

interface DecodedToken {
  id: string;
  role: string;
}

/**
 * Initialize Socket.IO server with authentication
 */
export const initializeSocket = (server: HttpServer): Server => {
  io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  // Authentication middleware
  io.use((socket: AuthenticatedSocket, next) => {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error("Authentication required"));
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as DecodedToken;
      socket.userId = decoded.id;
      socket.userRole = decoded.role;
      next();
    } catch (error) {
      return next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket: AuthenticatedSocket) => {
    console.log(`🔌 Socket connected: ${socket.id}, User: ${socket.userId}, Role: ${socket.userRole}`);

    // Join user to their personal room based on role
    if (socket.userId && socket.userRole) {
      if (socket.userRole === "USER") {
        socket.join(`user_${socket.userId}`);
        console.log(`👤 User ${socket.userId} joined room: user_${socket.userId}`);
      } else if (socket.userRole === "RIDER") {
        socket.join(`rider_${socket.userId}`);
        console.log(`🏍️ Rider ${socket.userId} joined room: rider_${socket.userId}`);
      } else if (socket.userRole === "ADMIN") {
        socket.join("admin");
        console.log(`👨‍💼 Admin ${socket.userId} joined room: admin`);
      }
    }

    // Handle rider location updates
    socket.on("location:update", (data: { lat: number; lng: number; rideId?: string }) => {
      if (socket.userRole === "RIDER" && socket.userId) {
        // If there's an active ride, send location to the user
        if (data.rideId) {
          // Emit to the ride-specific room
          io?.to(`ride_${data.rideId}`).emit("rider:location", {
            riderId: socket.userId,
            lat: data.lat,
            lng: data.lng,
            timestamp: new Date().toISOString(),
          });
        }
      }
    });

    // Handle rider going online/offline
    socket.on("rider:online", () => {
      if (socket.userRole === "RIDER" && socket.userId) {
        socket.join("online_riders");
        console.log(`🟢 Rider ${socket.userId} is now online`);
      }
    });

    socket.on("rider:offline", () => {
      if (socket.userRole === "RIDER" && socket.userId) {
        socket.leave("online_riders");
        console.log(`🔴 Rider ${socket.userId} is now offline`);
      }
    });

    // Join user to ride-specific room for real-time updates
    socket.on("ride:join", (rideId: string) => {
      socket.join(`ride_${rideId}`);
      console.log(`🚗 ${socket.userRole} ${socket.userId} joined ride room: ride_${rideId}`);
    });

    socket.on("ride:leave", (rideId: string) => {
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

/**
 * Get the Socket.IO instance
 */
export const getIO = (): Server | null => {
  return io;
};

/**
 * Emit event to a specific user
 */
export const emitToUser = (userId: string, event: string, data: any): void => {
  if (io) {
    io.to(`user_${userId}`).emit(event, data);
  }
};

/**
 * Emit event to a specific rider
 */
export const emitToRider = (riderId: string, event: string, data: any): void => {
  if (io) {
    io.to(`rider_${riderId}`).emit(event, data);
  }
};

/**
 * Emit event to all admins
 */
export const emitToAdmins = (event: string, data: any): void => {
  if (io) {
    io.to("admin").emit(event, data);
  }
};

/**
 * Emit event to all online riders
 */
export const emitToOnlineRiders = (event: string, data: any): void => {
  if (io) {
    io.to("online_riders").emit(event, data);
  }
};

/**
 * Emit event to a specific ride room
 */
export const emitToRide = (rideId: string, event: string, data: any): void => {
  if (io) {
    io.to(`ride_${rideId}`).emit(event, data);
  }
};
