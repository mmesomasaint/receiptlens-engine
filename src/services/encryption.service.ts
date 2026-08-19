// src/services/encryption.service.ts
import crypto from 'crypto';
import { config } from '../config';

export class EncryptionService {
  private algorithm = 'aes-256-gcm';
  private key: Buffer;

  constructor() {
    this.key = Buffer.from(config.encryptionKey, 'utf-8');
    if (this.key.length !== 32) {
      throw new Error('ENCRYPTION_KEY must be exactly 32 bytes (256 bits).');
    }
  }

  public encrypt(plainText: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
    let encrypted = cipher.update(plainText, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');
    // Format: iv:authTag:encryptedData
    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
  }

  public decrypt(cipherText: string): string {
    const [ivHex, authTagHex, encryptedData] = cipherText.split(':');
    if (!ivHex || !authTagHex || !encryptedData) {
      throw new Error('Malformed encrypted ciphertext token.');
    }
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }
}

export const encryptionService = new EncryptionService();
