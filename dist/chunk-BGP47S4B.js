// server/encryption.ts
import { createCipheriv, createDecipheriv, randomBytes } from "crypto";
var EncryptionService = class {
  static ALGORITHM = "aes-256-gcm";
  static IV_LENGTH = 16;
  // For GCM, this is 16 bytes
  static TAG_LENGTH = 16;
  // GCM tag length
  static getEncryptionKey() {
    const key = process.env.ENCRYPTION_KEY;
    if (!key) {
      throw new Error("ENCRYPTION_KEY environment variable is required for API key security");
    }
    if (Buffer.from(key, "hex").length !== 32) {
      throw new Error("ENCRYPTION_KEY must be a 64-character hex string (32 bytes)");
    }
    return Buffer.from(key, "hex");
  }
  /**
   * Encrypts sensitive data using AES-256-GCM
   * @param plaintext The data to encrypt
   * @returns Base64-encoded encrypted data with IV and auth tag
   */
  static encrypt(plaintext) {
    try {
      const key = this.getEncryptionKey();
      const iv = randomBytes(this.IV_LENGTH);
      const cipher = createCipheriv(this.ALGORITHM, key, iv);
      let encrypted = cipher.update(plaintext, "utf8", "hex");
      encrypted += cipher.final("hex");
      const authTag = cipher.getAuthTag();
      const combined = Buffer.concat([iv, authTag, Buffer.from(encrypted, "hex")]);
      return combined.toString("base64");
    } catch (error) {
      console.error("Encryption failed:", error);
      throw new Error("Failed to encrypt sensitive data");
    }
  }
  /**
   * Decrypts data encrypted with encrypt()
   * @param encryptedData Base64-encoded encrypted data
   * @returns The original plaintext
   */
  static decrypt(encryptedData) {
    try {
      const key = this.getEncryptionKey();
      const combined = Buffer.from(encryptedData, "base64");
      const iv = combined.subarray(0, this.IV_LENGTH);
      const authTag = combined.subarray(this.IV_LENGTH, this.IV_LENGTH + this.TAG_LENGTH);
      const encrypted = combined.subarray(this.IV_LENGTH + this.TAG_LENGTH);
      const decipher = createDecipheriv(this.ALGORITHM, key, iv);
      decipher.setAuthTag(authTag);
      let decrypted = decipher.update(encrypted, void 0, "utf8");
      decrypted += decipher.final("utf8");
      return decrypted;
    } catch (error) {
      console.error("Decryption failed:", error);
      throw new Error("Failed to decrypt sensitive data");
    }
  }
  /**
   * Generates a new encryption key (for initial setup)
   * @returns A 64-character hex string representing a 32-byte key
   */
  static generateKey() {
    return randomBytes(32).toString("hex");
  }
};

export {
  EncryptionService
};
