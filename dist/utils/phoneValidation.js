"use strict";
/**
 * Phone number validation utilities
 * Ensures phone numbers are in E.164 format for Twilio compatibility
 * E.164 format: +[country code][phone number] (e.g., +919876543210)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizePhone = exports.validatePhoneNumber = exports.isValidE164Phone = void 0;
/**
 * Validates if a phone number is in E.164 format
 * @param phone - Phone number to validate
 * @returns true if valid E.164 format
 */
const isValidE164Phone = (phone) => {
    // E.164 format: starts with +, followed by 1-3 digit country code, then 6-14 digits
    // Total length: 8-15 characters (including +)
    const e164Regex = /^\+[1-9]\d{7,14}$/;
    return e164Regex.test(phone);
};
exports.isValidE164Phone = isValidE164Phone;
/**
 * Validates phone number and throws error if invalid
 * @param phone - Phone number to validate
 * @throws Error if phone number is not in E.164 format
 */
const validatePhoneNumber = (phone) => {
    if (!phone) {
        throw new Error("Phone number is required");
    }
    if (!(0, exports.isValidE164Phone)(phone)) {
        throw new Error("Invalid phone number format. Phone must include country code (e.g., +919876543210)");
    }
};
exports.validatePhoneNumber = validatePhoneNumber;
/**
 * Normalizes phone number by ensuring it starts with +
 * This is a safety measure, but frontend should always send with +
 * @param phone - Phone number to normalize
 * @returns Normalized phone number
 */
const normalizePhone = (phone) => {
    // If phone doesn't start with +, it's invalid for Twilio
    if (!phone.startsWith("+")) {
        throw new Error("Phone number must include country code starting with + (e.g., +919876543210)");
    }
    return phone.trim();
};
exports.normalizePhone = normalizePhone;
