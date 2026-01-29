/**
 * Tests unitaires pour les utilitaires de mot de passe
 */
import { hashPassword, verifyPassword, generateTemporaryPassword } from '../../../src/modules/auth/utils/password.util';

describe('Password Utils', () => {
  describe('hashPassword', () => {
    it('should hash a password', async () => {
      const password = 'TestPassword123!';
      const hash = await hashPassword(password);

      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(50);
    });

    it('should generate different hashes for same password', async () => {
      const password = 'TestPassword123!';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('verifyPassword', () => {
    it('should verify correct password', async () => {
      const password = 'TestPassword123!';
      const hash = await hashPassword(password);

      const isValid = await verifyPassword(password, hash);
      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const password = 'TestPassword123!';
      const hash = await hashPassword(password);

      const isValid = await verifyPassword('WrongPassword', hash);
      expect(isValid).toBe(false);
    });
  });

  describe('generateTemporaryPassword', () => {
    it('should generate password with default length', () => {
      const password = generateTemporaryPassword();
      expect(password).toHaveLength(8);
    });

    it('should generate password with custom length', () => {
      const password = generateTemporaryPassword(12);
      expect(password).toHaveLength(12);
    });

    it('should generate different passwords each time', () => {
      const passwords = new Set();
      for (let i = 0; i < 10; i++) {
        passwords.add(generateTemporaryPassword());
      }
      expect(passwords.size).toBe(10);
    });
  });
});
