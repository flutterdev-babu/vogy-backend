/**
 * Sanitizes ride data for different audiences.
 */

/**
 * Prepares a ride object for partner socket emissions and API responses.
 * Ensures username and mobile are present and restricts financial info to earnings.
 */
export const sanitizeRideForPartner = (ride: any) => {
  if (!ride) return null;

  // Flatten user info if present
  const userName = ride.user?.name || ride.userName || "Customer";
  const userMobile = ride.user?.phone || ride.userPhone || ride.altMobile || "";
  const userProfileImage = ride.user?.profileImage || null;

  // Ensure earnings are not null
  const earnings = ride.riderEarnings !== null && ride.riderEarnings !== undefined 
    ? ride.riderEarnings 
    : 0;

  // Create sanitized object
  const sanitized = {
    ...ride,
    userName,
    userMobile,
    userPhone: userMobile, // Backward compatibility
    userProfileImage,
    earnings,
    riderEarnings: earnings, // Keep original field name too
  };

  // Remove sensitive/unnecessary info for partner
  const sensitiveFields = [
    "totalFare",
    "baseFare",
    "perKmPrice",
    "commission",
    "discountAmount",
    "couponCode",
    "taxes",
    "appCommission",
    "user", // We already extracted what we need
  ];

  sensitiveFields.forEach((field) => {
    delete sanitized[field];
  });

  return sanitized;
};
