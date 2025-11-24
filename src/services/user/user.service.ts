import { prisma } from "../../config/prisma";
import { generateUnique4DigitOtp } from "../../utils/generateUniqueOtp";

/* ============================================
    GET USER PROFILE
============================================ */
export const getUserProfile = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      phone: true,
      email: true,
      profileImage: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  return user;
};

/* ============================================
    UPDATE USER PROFILE
============================================ */
export const updateUserProfile = async (
  userId: string,
  data: {
    name?: string;
    email?: string;
    profileImage?: string;
  }
) => {
  // Check if user exists
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new Error("User not found");
  }

  // Check if email is being updated and if it's already taken by another user
  if (data.email && data.email !== user.email) {
    const emailExists = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (emailExists) {
      throw new Error("Email is already registered");
    }
  }

  // Update user profile
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.email !== undefined && { email: data.email || null }),
      ...(data.profileImage !== undefined && {
        profileImage: data.profileImage || null,
      }),
    },
    select: {
      id: true,
      name: true,
      phone: true,
      email: true,
      profileImage: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return updatedUser;
};

/* ============================================
    UPDATE USER UNIQUE OTP
============================================ */
export const updateUserUniqueOtp = async (userId: string) => {
  // Check if user exists
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new Error("User not found");
  }

  // Generate new unique OTP
  const newUniqueOtp = await generateUnique4DigitOtp();

  // Update user's unique OTP
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      uniqueOtp: newUniqueOtp,
    },
    select: {
      id: true,
      name: true,
      phone: true,
      uniqueOtp: true,
      updatedAt: true,
    },
  });

  return updatedUser;
};

/* ============================================
    GET USER UNIQUE OTP (for user to see their OTP)
============================================ */
export const getUserUniqueOtp = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      phone: true,
      uniqueOtp: true,
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  return user;
};

