/**
 * MongoDB ObjectID validation utility
 * Ensures strings are valid 24-character hex strings before passing to Prisma
 */

/**
 * Validates if a string is a valid MongoDB ObjectID (24-character hex)
 * @param id - String to validate
 * @returns true if valid ObjectID format
 */
export const isValidObjectId = (id: string): boolean => {
  return /^[0-9a-fA-F]{24}$/.test(id);
};

/**
 * Validates ObjectID and throws error if invalid
 * @param id - String to validate
 * @param fieldName - Name of the field for the error message
 * @throws Error if ID is invalid
 */
export const validateObjectId = (id: string | undefined | null, fieldName: string = "ID"): void => {
  if (!id) return; // Allow empty/null if it's optional
  
  if (!isValidObjectId(id)) {
    throw new Error(`Invalid ${fieldName}: Malformed ObjectID format`);
  }
};
