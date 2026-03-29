/**
 * Phone number validation utilities
 * Ensures phone numbers are in E.164 format for Twilio compatibility
 * E.164 format: +[country code][phone number] (e.g., +919876543210)
 */

/**
 * Validates if a phone number is in E.164 format
 * @param phone - Phone number to validate
 * @returns true if valid E.164 format
 */
export const isValidE164Phone = (phone: string): boolean => {
  // Support 10 digits or E.164
  const indian10Digit = /^\d{10}$/;
  const e164Regex = /^\+[1-9]\d{7,14}$/;
  return indian10Digit.test(phone) || e164Regex.test(phone);
};

/**
 * Validates phone number and throws error if invalid
 * @param phone - Phone number to validate
 * @throws Error if phone number is invalid
 */
export const validatePhoneNumber = (phone: string): void => {
  if (!phone) {
    throw new Error("Phone number is required");
  }

  if (!isValidE164Phone(phone)) {
    throw new Error(
      "Invalid phone number format. Enter a 10-digit mobile number or include country code (e.g., +919876543210)"
    );
  }
};

/**
 * Normalizes phone number by ensuring it starts with +91 if 10 digits
 * @param phone - Phone number to normalize
 * @returns Normalized phone number
 */
export const normalizePhone = (phone: string): string => {
  let p = phone.trim();

  // If 10 digits, assume India (+91)
  if (/^\d{10}$/.test(p)) {
    return `+91${p}`;
  }

  // If starts with 91 (12 digits), add +
  if (/^91\d{10}$/.test(p)) {
    return `+${p}`;
  }

  // If phone doesn't start with +, it's invalid for Twilio
  if (!p.startsWith("+")) {
    throw new Error(
      "Phone number must include country code starting with + (e.g., +919876543210)"
    );
  }
  return p;
};
