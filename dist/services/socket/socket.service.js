"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.emitRideCancelled = exports.emitRideCompleted = exports.emitRideStarted = exports.emitRideArrived = exports.emitRideAccepted = exports.emitRiderAssigned = exports.emitManualRideCreated = exports.emitRideCreated = exports.RideSocketEvents = void 0;
const socket_1 = require("../../config/socket");
/**
 * Socket events for ride lifecycle
 */
exports.RideSocketEvents = {
    // Events for Users
    RIDE_CREATED: "ride:created",
    RIDE_PARTNER_ASSIGNED: "ride:partner_assigned",
    RIDE_RIDER_ASSIGNED: "ride:rider_assigned", // Legacy
    RIDE_ACCEPTED: "ride:accepted",
    RIDE_ARRIVED: "ride:arrived",
    RIDE_STARTED: "ride:started",
    RIDE_COMPLETED: "ride:completed",
    RIDE_CANCELLED: "ride:cancelled",
    PARTNER_LOCATION: "partner:location",
    RIDER_LOCATION: "rider:location", // Legacy
    // Events for Partners
    RIDE_NEW_REQUEST: "ride:new_request",
    RIDE_ASSIGNED: "ride:assigned",
    RIDE_USER_CANCELLED: "ride:user_cancelled",
    // Events for Admins
    RIDE_NEW_SCHEDULED: "ride:new_scheduled",
    RIDE_STATUS_CHANGED: "ride:status_changed",
};
/**
 * Emit when a new ride is created (instant booking)
 */
const emitRideCreated = (ride) => {
    // Notify the user who created the ride
    if (ride.userId) {
        (0, socket_1.emitToUser)(ride.userId, exports.RideSocketEvents.RIDE_CREATED, {
            message: "Ride created successfully",
            ride,
        });
    }
    // If instant booking, notify online partners
    if (!ride.isManualBooking) {
        (0, socket_1.emitToOnlineRiders)(exports.RideSocketEvents.RIDE_NEW_REQUEST, {
            message: "New ride request available",
            ride,
        });
    }
};
exports.emitRideCreated = emitRideCreated;
/**
 * Emit when a manual/scheduled ride is created
 */
const emitManualRideCreated = (ride) => {
    // Notify the user
    if (ride.userId) {
        (0, socket_1.emitToUser)(ride.userId, exports.RideSocketEvents.RIDE_CREATED, {
            message: "Scheduled ride booked successfully",
            ride,
        });
    }
    // Notify admins about new scheduled ride
    (0, socket_1.emitToAdmins)(exports.RideSocketEvents.RIDE_NEW_SCHEDULED, {
        message: "New scheduled ride awaiting assignment",
        ride,
    });
};
exports.emitManualRideCreated = emitManualRideCreated;
/**
 * Emit when admin assigns a partner to a scheduled ride
 */
const emitRiderAssigned = (ride) => {
    // Notify the user
    if (ride.userId) {
        // Emit both new and legacy events
        (0, socket_1.emitToUser)(ride.userId, exports.RideSocketEvents.RIDE_PARTNER_ASSIGNED, {
            message: "A captain has been assigned to your ride",
            ride,
        });
        (0, socket_1.emitToUser)(ride.userId, exports.RideSocketEvents.RIDE_RIDER_ASSIGNED, {
            message: "A captain has been assigned to your ride",
            ride,
        });
    }
    // Notify the assigned partner
    if (ride.partnerId) {
        (0, socket_1.emitToPartner)(ride.partnerId, exports.RideSocketEvents.RIDE_ASSIGNED, {
            message: "You have been assigned a new ride",
            ride,
        });
    }
};
exports.emitRiderAssigned = emitRiderAssigned;
/**
 * Emit when partner accepts a ride
 */
const emitRideAccepted = (ride) => {
    if (ride.userId) {
        (0, socket_1.emitToUser)(ride.userId, exports.RideSocketEvents.RIDE_ACCEPTED, {
            message: "A captain has accepted your ride",
            ride,
        });
    }
    // Notify admins
    (0, socket_1.emitToAdmins)(exports.RideSocketEvents.RIDE_STATUS_CHANGED, {
        status: "ACCEPTED",
        ride,
    });
};
exports.emitRideAccepted = emitRideAccepted;
/**
 * Emit when partner arrives at pickup
 */
const emitRideArrived = (ride) => {
    if (ride.userId) {
        (0, socket_1.emitToUser)(ride.userId, exports.RideSocketEvents.RIDE_ARRIVED, {
            message: "Your captain has arrived at the pickup location",
            ride,
        });
    }
    (0, socket_1.emitToAdmins)(exports.RideSocketEvents.RIDE_STATUS_CHANGED, {
        status: "ARRIVED",
        ride,
    });
};
exports.emitRideArrived = emitRideArrived;
/**
 * Emit when ride starts
 */
const emitRideStarted = (ride) => {
    if (ride.userId) {
        (0, socket_1.emitToUser)(ride.userId, exports.RideSocketEvents.RIDE_STARTED, {
            message: "Your ride has started",
            ride,
        });
    }
    (0, socket_1.emitToAdmins)(exports.RideSocketEvents.RIDE_STATUS_CHANGED, {
        status: "STARTED",
        ride,
    });
};
exports.emitRideStarted = emitRideStarted;
/**
 * Emit when ride is completed
 */
const emitRideCompleted = (ride) => {
    if (ride.userId) {
        (0, socket_1.emitToUser)(ride.userId, exports.RideSocketEvents.RIDE_COMPLETED, {
            message: "Your ride has been completed",
            ride,
        });
    }
    if (ride.partnerId) {
        (0, socket_1.emitToPartner)(ride.partnerId, exports.RideSocketEvents.RIDE_COMPLETED, {
            message: "Ride completed successfully",
            ride,
        });
    }
    (0, socket_1.emitToAdmins)(exports.RideSocketEvents.RIDE_STATUS_CHANGED, {
        status: "COMPLETED",
        ride,
    });
};
exports.emitRideCompleted = emitRideCompleted;
/**
 * Emit when ride is cancelled by user
 */
const emitRideCancelled = (ride, cancelledBy) => {
    if (cancelledBy === "USER" && ride.partnerId) {
        (0, socket_1.emitToPartner)(ride.partnerId, exports.RideSocketEvents.RIDE_USER_CANCELLED, {
            message: "The user has cancelled the ride",
            ride,
        });
    }
    if ((cancelledBy === "PARTNER" || cancelledBy === "RIDER") && ride.userId) {
        (0, socket_1.emitToUser)(ride.userId, exports.RideSocketEvents.RIDE_CANCELLED, {
            message: "The captain has cancelled the ride",
            ride,
        });
    }
    (0, socket_1.emitToAdmins)(exports.RideSocketEvents.RIDE_STATUS_CHANGED, {
        status: "CANCELLED",
        ride,
    });
};
exports.emitRideCancelled = emitRideCancelled;
