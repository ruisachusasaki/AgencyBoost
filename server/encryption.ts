import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

// AES-GCM encryption utility for securing API keys and sensitive data
export class EncryptionService {
  private static readonly ALGORITHM = 'aes-256-gcm';
  private static readonly IV_LENGTH = 16; // For GCM, this is 16 bytes
  private static readonly TAG_LENGTH = 16; // GCM tag length
  
  private static getEncryptionKey(): Buffer {
    const key = process.env.ENCRYPTION_KEY;
    if (!key) {
      throw new Error('ENCRYPTION_KEY environment variable is required for API key security');
    }
    
    // Ensure key is exactly 32 bytes for AES-256
    if (Buffer.from(key, 'hex').length !== 32) {
      throw new Error('ENCRYPTION_KEY must be a 64-character hex string (32 bytes)');
    }
    
    return Buffer.from(key, 'hex');
  }
  
  /**
   * Encrypts sensitive data using AES-256-GCM
   * @param plaintext The data to encrypt
   * @returns Base64-encoded encrypted data with IV and auth tag
   */
  static encrypt(plaintext: string): string {
    try {
      const key = this.getEncryptionKey();
      const iv = randomBytes(this.IV_LENGTH);
      
      const cipher = createCipheriv(this.ALGORITHM, key, iv);
      
      let encrypted = cipher.update(plaintext, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      const authTag = cipher.getAuthTag();
      
      // Combine IV + authTag + encrypted data and encode as base64
      const combined = Buffer.concat([iv, authTag, Buffer.from(encrypted, 'hex')]);
      return combined.toString('base64');
    } catch (error) {
      console.error('Encryption failed:', error);
      throw new Error('Failed to encrypt sensitive data');
    }
  }
  
  /**
   * Decrypts data encrypted with encrypt()
   * @param encryptedData Base64-encoded encrypted data
   * @returns The original plaintext
   */
  static decrypt(encryptedData: string): string {
    try {
      const key = this.getEncryptionKey();
      const combined = Buffer.from(encryptedData, 'base64');
      
      // Extract IV, auth tag, and encrypted data
      const iv = combined.subarray(0, this.IV_LENGTH);
      const authTag = combined.subarray(this.IV_LENGTH, this.IV_LENGTH + this.TAG_LENGTH);
      const encrypted = combined.subarray(this.IV_LENGTH + this.TAG_LENGTH);
      
      const decipher = createDecipheriv(this.ALGORITHM, key, iv);
      decipher.setAuthTag(authTag);
      
      let decrypted = decipher.update(encrypted, undefined, 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('Failed to decrypt sensitive data');
    }
  }
  
  /**
   * Generates a new encryption key (for initial setup)
   * @returns A 64-character hex string representing a 32-byte key
   */
  static generateKey(): string {
    return randomBytes(32).toString('hex');
  }
}