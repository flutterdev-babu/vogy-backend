import { prisma } from "../config/prisma";

/**
 * Generate a unique 4-digit OTP for user
 * Ensures the OTP is unique in the database
 */
export const generateUnique4DigitOtp = async (): Promise<string> => {
  let otp: string;
  let isUnique = false;
  let attempts = 0;
  const maxAttempts = 100;

  while (!isUnique && attempts < maxAttempts) {
    // Generate 4-digit OTP (1000-9999)
    otp = Math.floor(1000 + Math.random() * 9000).toString();

    // Check if OTP already exists (use findFirst for compatibility)
    const exists = await prisma.user.findFirst({
      where: { uniqueOtp: otp },
    });

    if (!exists) {
      isUnique = true;
    }

    attempts++;
  }

  if (!isUnique) {
    throw new Error("Failed to generate unique OTP. Please try again.");
  }

  return otp!;
};

