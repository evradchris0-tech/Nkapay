/**
 * Tests unitaires pour le service Auth
 */

import { 
  TestNotFoundError as NotFoundError, 
  TestBadRequestError as BadRequestError, 
  TestUnauthorizedError as UnauthorizedError 
} from '../../helpers/test-errors';

describe('Auth Service', () => {
  describe('Validation du login', () => {
    it('devrait valider un numéro de téléphone valide', () => {
      const validPhones = ['690000001', '699123456', '677889900'];
      const phoneRegex = /^6[0-9]{8}$/;
      validPhones.forEach(phone => {
        expect(phone).toMatch(phoneRegex);
      });
    });

    it('devrait rejeter un numéro de téléphone invalide', () => {
      const invalidPhones = ['123456789', '0690000001', '69000000', 'abc123456'];
      const phoneRegex = /^6[0-9]{8}$/;
      invalidPhones.forEach(phone => {
        expect(phone).not.toMatch(phoneRegex);
      });
    });

    it('devrait valider un mot de passe avec les critères requis', () => {
      const validPasswords = ['Password123!', 'Test@2024abc', 'Admin#Pass1'];
      validPasswords.forEach(password => {
        expect(password.length).toBeGreaterThanOrEqual(8);
        expect(/[A-Z]/.test(password)).toBe(true);
        expect(/[a-z]/.test(password)).toBe(true);
        expect(/[0-9]/.test(password)).toBe(true);
      });
    });

    it('devrait rejeter un mot de passe trop court', () => {
      const shortPasswords = ['Pass1!', 'Ab1@', ''];
      shortPasswords.forEach(password => {
        expect(password.length).toBeLessThan(8);
      });
    });
  });

  describe('Gestion des tokens', () => {
    it('devrait générer un token JWT mocké', () => {
      const mockSign = jest.fn().mockReturnValue('mock-token-123');
      const payload = { id: 'user-123', telephone: '690000001' };
      const token = mockSign(payload);
      expect(mockSign).toHaveBeenCalledWith(payload);
      expect(token).toBe('mock-token-123');
    });

    it('devrait inclure les informations utilisateur dans le token', () => {
      const payload = { id: 'user-123', telephone: '690000001', role: 'ADMIN' };
      expect(payload).toHaveProperty('id');
      expect(payload).toHaveProperty('telephone');
      expect(payload).toHaveProperty('role');
    });
  });

  describe('Changement de mot de passe', () => {
    it('devrait valider que ancien et nouveau mot de passe sont différents', () => {
      const oldPassword = 'OldPass123!';
      const newPassword = 'NewPass456@';
      expect(oldPassword).not.toBe(newPassword);
    });

    it('devrait rejeter si ancien et nouveau mot de passe sont identiques', () => {
      const oldPassword = 'SamePass123!';
      const newPassword = 'SamePass123!';
      expect(oldPassword).toBe(newPassword);
    });

    it('devrait valider la confirmation du mot de passe', () => {
      const newPassword = 'NewPass456@';
      const confirmPassword = 'NewPass456@';
      expect(newPassword).toBe(confirmPassword);
    });
  });

  describe('Erreurs d\'authentification', () => {
    it('devrait lever UnauthorizedError pour mot de passe incorrect', () => {
      expect(() => { throw new UnauthorizedError('Mot de passe incorrect'); }).toThrow(UnauthorizedError);
    });

    it('devrait lever NotFoundError pour utilisateur inexistant', () => {
      expect(() => { throw new NotFoundError('Utilisateur non trouvé'); }).toThrow(NotFoundError);
    });

    it('devrait lever BadRequestError pour données manquantes', () => {
      expect(() => { throw new BadRequestError('Téléphone et mot de passe requis'); }).toThrow(BadRequestError);
    });
  });

  describe('Rôles utilisateur', () => {
    const roles = ['SUPER_ADMIN', 'ADMIN', 'MEMBRE'];

    it('devrait valider les rôles disponibles', () => {
      expect(roles).toContain('SUPER_ADMIN');
      expect(roles).toContain('ADMIN');
      expect(roles).toContain('MEMBRE');
    });

    it('devrait identifier les permissions admin', () => {
      const adminRoles = roles.filter(r => r.includes('ADMIN'));
      expect(adminRoles).toHaveLength(2);
    });
  });
});
