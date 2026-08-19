// tests/unit/encryption.test.ts
import { encryptionService } from '../../src/services/encryption.service';

describe('EncryptionService (AES-256-GCM)', () => {
  it('should encrypt a plaintext refresh token and successfully decrypt it back', () => {
    const rawToken = '1//04_test_google_refresh_token_secret_xyz123';
    const encrypted = encryptionService.encrypt(rawToken);

    expect(encrypted).toBeDefined();
    expect(encrypted).not.toEqual(rawToken);
    expect(encrypted.split(':').length).toBe(3); // iv:authTag:cipher

    const decrypted = encryptionService.decrypt(encrypted);
    expect(decrypted).toEqual(rawToken);
  });

  it('should throw an error when attempting to decrypt tampered cipher data', () => {
    const rawToken = 'sample_refresh_token';
    const encrypted = encryptionService.encrypt(rawToken);
    const tampered = encrypted.slice(0, -4) + 'ffff';

    expect(() => encryptionService.decrypt(tampered)).toThrow();
  });
});
