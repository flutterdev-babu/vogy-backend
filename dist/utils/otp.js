"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOtpExpiry = exports.generateOtp = void 0;
const generateOtp = (length = 6) => {
    const max = 10 ** length;
    const code = Math.floor(Math.random() * max).toString().padStart(length, "0");
    return code;
};
exports.generateOtp = generateOtp;
const getOtpExpiry = () => {
    const mins = Number(process.env.OTP_EXPIRY_MIN ?? 10);
    return new Date(Date.now() + mins * 60 * 1000);
};
exports.getOtpExpiry = getOtpExpiry;
