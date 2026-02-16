import {
  emitToUser,
  emitToPartner,
  emitToAdmins,
  emitToOnlineRiders,
  emitToRide,
} from "../../config/socket";

/**
 * Socket events for ride lifecycle
 */
export const RideSocketEvents = {
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
export const emitRideCreated = (ride: any): void => {
  // Notify the user who created the ride
  if (ride.userId) {
    emitToUser(ride.userId, RideSocketEvents.RIDE_CREATED, {
      message: "Ride created successfully",
      ride,
    });
  }

  // If instant booking, notify online partners
  if (!ride.isManualBooking) {
    emitToOnlineRiders(RideSocketEvents.RIDE_NEW_REQUEST, {
      message: "New ride request available",
      ride,
    });
  }
};

/**
 * Emit when a manual/scheduled ride is created
 */
export const emitManualRideCreated = (ride: any): void => {
  // Notify the user
  if (ride.userId) {
    emitToUser(ride.userId, RideSocketEvents.RIDE_CREATED, {
      message: "Scheduled ride booked successfully",
      ride,
    });
  }

  // Notify admins about new scheduled ride
  emitToAdmins(RideSocketEvents.RIDE_NEW_SCHEDULED, {
    message: "New scheduled ride awaiting assignment",
    ride,
  });
};

/**
 * Emit when admin assigns a partner to a scheduled ride
 */
export const emitRiderAssigned = (ride: any): void => {
  // Notify the user
  if (ride.userId) {
    // Emit both new and legacy events
    emitToUser(ride.userId, RideSocketEvents.RIDE_PARTNER_ASSIGNED, {
      message: "A captain has been assigned to your ride",
      ride,
    });
    emitToUser(ride.userId, RideSocketEvents.RIDE_RIDER_ASSIGNED, {
      message: "A captain has been assigned to your ride",
      ride,
    });
  }

  // Notify the assigned partner
  if (ride.partnerId) {
    emitToPartner(ride.partnerId, RideSocketEvents.RIDE_ASSIGNED, {
      message: "You have been assigned a new ride",
      ride,
    });
  }
};

/**
 * Emit when partner accepts a ride
 */
export const emitRideAccepted = (ride: any): void => {
  if (ride.userId) {
    emitToUser(ride.userId, RideSocketEvents.RIDE_ACCEPTED, {
      message: "A captain has accepted your ride",
      ride,
    });
  }

  // Notify admins
  emitToAdmins(RideSocketEvents.RIDE_STATUS_CHANGED, {
    status: "ACCEPTED",
    ride,
  });
};

/**
 * Emit when partner arrives at pickup
 */
export const emitRideArrived = (ride: any): void => {
  if (ride.userId) {
    emitToUser(ride.userId, RideSocketEvents.RIDE_ARRIVED, {
      message: "Your captain has arrived at the pickup location",
      ride,
    });
  }

  emitToAdmins(RideSocketEvents.RIDE_STATUS_CHANGED, {
    status: "ARRIVED",
    ride,
  });
};

/**
 * Emit when ride starts
 */
export const emitRideStarted = (ride: any): void => {
  if (ride.userId) {
    emitToUser(ride.userId, RideSocketEvents.RIDE_STARTED, {
      message: "Your ride has started",
      ride,
    });
  }

  emitToAdmins(RideSocketEvents.RIDE_STATUS_CHANGED, {
    status: "STARTED",
    ride,
  });
};

/**
 * Emit when ride is completed
 */
export const emitRideCompleted = (ride: any): void => {
  if (ride.userId) {
    emitToUser(ride.userId, RideSocketEvents.RIDE_COMPLETED, {
      message: "Your ride has been completed",
      ride,
    });
  }

  if (ride.partnerId) {
    emitToPartner(ride.partnerId, RideSocketEvents.RIDE_COMPLETED, {
      message: "Ride completed successfully",
      ride,
    });
  }

  emitToAdmins(RideSocketEvents.RIDE_STATUS_CHANGED, {
    status: "COMPLETED",
    ride,
  });
};

/**
 * Emit when ride is cancelled by user
 */
export const emitRideCancelled = (ride: any, cancelledBy: "USER" | "PARTNER" | "RIDER"): void => {
  if (cancelledBy === "USER" && ride.partnerId) {
    emitToPartner(ride.partnerId, RideSocketEvents.RIDE_USER_CANCELLED, {
      message: "The user has cancelled the ride",
      ride,
    });
  }

  if ((cancelledBy === "PARTNER" || cancelledBy === "RIDER") && ride.userId) {
    emitToUser(ride.userId, RideSocketEvents.RIDE_CANCELLED, {
      message: "The captain has cancelled the ride",
      ride,
    });
  }

  emitToAdmins(RideSocketEvents.RIDE_STATUS_CHANGED, {
    status: "CANCELLED",
    ride,
  });
};
