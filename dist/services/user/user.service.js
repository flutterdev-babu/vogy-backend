"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserUniqueOtp = exports.updateUserUniqueOtp = exports.updateUserProfile = exports.getUserProfile = void 0;
const prisma_1 = require("../../config/prisma");
const generateUniqueOtp_1 = require("../../utils/generateUniqueOtp");
/* ============================================
    GET USER PROFILE
============================================ */
const getUserProfile = async (userId) => {
    const user = await prisma_1.prisma.user.findUnique({
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
exports.getUserProfile = getUserProfile;
/* ============================================
    UPDATE USER PROFILE
============================================ */
const updateUserProfile = async (userId, data) => {
    // Check if user exists
    const user = await prisma_1.prisma.user.findUnique({
        where: { id: userId },
    });
    if (!user) {
        throw new Error("User not found");
    }
    // Check if email is being updated and if it's already taken by another user
    if (data.email && data.email !== user.email) {
        const emailExists = await prisma_1.prisma.user.findUnique({
            where: { email: data.email },
        });
        if (emailExists) {
            throw new Error("Email is already registered");
        }
    }
    // Update user profile
    const updatedUser = await prisma_1.prisma.user.update({
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
exports.updateUserProfile = updateUserProfile;
/* ============================================
    UPDATE USER UNIQUE OTP
============================================ */
const updateUserUniqueOtp = async (userId) => {
    // Check if user exists
    const user = await prisma_1.prisma.user.findUnique({
        where: { id: userId },
    });
    if (!user) {
        throw new Error("User not found");
    }
    // Generate new unique OTP
    const newUniqueOtp = await (0, generateUniqueOtp_1.generateUnique4DigitOtp)();
    // Update user's unique OTP
    const updatedUser = await prisma_1.prisma.user.update({
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
exports.updateUserUniqueOtp = updateUserUniqueOtp;
/* ============================================
    GET USER UNIQUE OTP (for user to see their OTP)
============================================ */
const getUserUniqueOtp = async (userId) => {
    const user = await prisma_1.prisma.user.findUnique({
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
exports.getUserUniqueOtp = getUserUniqueOtp;
