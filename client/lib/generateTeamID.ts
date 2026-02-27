import crypto from "crypto";

/**
 * Utility: Generates a 6-character alphanumeric code
 */
const generateCode = (): string => {
    const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // No ambiguous chars
    const bytes = crypto.randomBytes(10);
    let result = "";
    for (let i = 0; i < 10; i++) {
        result += chars.charAt(bytes[i] % chars.length);
    }
    return result;
};

export default generateCode;