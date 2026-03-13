/**
 * Tests unitaires pour UtilisateurService
 */

import { createMockRepo } from '../../helpers/mock-repo';

const mockUtilisateurRepo = createMockRepo();

jest.mock('../../../src/config/database.config', () => ({
  AppDataSource: {
    getRepository: jest.fn(() => mockUtilisateurRepo),
    isInitialized: true,
  },
}));

jest.mock('../../../src/config', () => ({
  AppDataSource: {
    getRepository: jest.fn(() => mockUtilisateurRepo),
    isInitialized: true,
  },
  env: { nodeEnv: 'test', db: {} },
  isDevelopment: false,
}));

jest.mock('../../../src/shared/errors/app-error', () => ({
  NotFoundError: class NotFoundError extends Error {
    statusCode = 404;
    constructor(message: string) { super(`NotFoundError: ${message}`); this.name = 'NotFoundError'; }
  },
  BadRequestError: class BadRequestError extends Error {
    statusCode = 400;
    constructor(message: string) { super(`BadRequestError: ${message}`); this.name = 'BadRequestError'; }
  },
  ConflictError: class ConflictError extends Error {
    statusCode = 409;
    constructor(message: string) { super(`ConflictError: ${message}`); this.name = 'ConflictError'; }
  },
}));

jest.mock('../../../src/modules/auth/utils/password.util', () => ({
  hashPassword: jest.fn().mockResolvedValue('hashed-password'),
  verifyPassword: jest.fn().mockResolvedValue(true),
}));

import { UtilisateurService } from '../../../src/modules/utilisateurs/services/utilisateur.service';

function makeMockUser(overrides: any = {}) {
  return {
    id: 'user-uuid-1',
    prenom: 'Jean',
    nom: 'Dupont',
    telephone1: '690000001',
    telephone2: null,
    passwordHash: 'hashed-password',
    doitChangerMotDePasse: true,
    estSuperAdmin: false,
    languePrefereeId: null,
    languePreferee: null,
    creeLe: new Date(),
    modifieLe: null,
    ...overrides,
  };
}

describe('UtilisateurService', () => {
  let service: UtilisateurService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new UtilisateurService();
    mockUtilisateurRepo.create.mockImplementation((data: any) => ({ ...data }));
    mockUtilisateurRepo.save.mockImplementation((data: any) =>
      Promise.resolve({ id: 'user-uuid-1', ...data })
    );
  });

  describe('create()', () => {
    it('hashe le mot de passe lors de la création', async () => {
      mockUtilisateurRepo.findOne.mockResolvedValue(null); // no conflict

      const { hashPassword } = require('../../../src/modules/auth/utils/password.util');

      await service.create({
        prenom: 'Jean',
        nom: 'Dupont',
        telephone1: '690000001',
        password: 'password123',
      });

      expect(hashPassword).toHaveBeenCalledWith('password123');
      expect(mockUtilisateurRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ passwordHash: 'hashed-password' })
      );
    });

    it('lève ConflictError si téléphone principal déjà utilisé', async () => {
      mockUtilisateurRepo.findOne.mockResolvedValueOnce(makeMockUser()); // exists

      await expect(
        service.create({ prenom: 'Jean', nom: 'Dupont', telephone1: '690000001', password: 'pass' })
      ).rejects.toThrow('ConflictError');
    });

    it('lève ConflictError si téléphone secondaire déjà utilisé', async () => {
      mockUtilisateurRepo.findOne
        .mockResolvedValueOnce(null)       // telephone1 ok
        .mockResolvedValueOnce(makeMockUser()); // telephone2 conflict

      await expect(
        service.create({ prenom: 'Jean', nom: 'Dupont', telephone1: '690000001', telephone2: '690000002', password: 'pass' })
      ).rejects.toThrow('ConflictError');
    });
  });

  describe('update()', () => {
    it('met à jour les champs modifiables', async () => {
      mockUtilisateurRepo.findOne.mockResolvedValue(makeMockUser());

      await service.update('user-uuid-1', { prenom: 'Paul' });

      expect(mockUtilisateurRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ prenom: 'Paul' })
      );
    });

    it('lève NotFoundError si utilisateur inexistant', async () => {
      mockUtilisateurRepo.findOne.mockResolvedValue(null);

      await expect(service.update('unknown', { prenom: 'Test' })).rejects.toThrow('NotFoundError');
    });
  });

  describe('findByTelephone()', () => {
    it('retourne null si non trouvé', async () => {
      mockUtilisateurRepo.findOne.mockResolvedValue(null);

      const result = await service.findByTelephone('000000000');

      expect(result).toBeNull();
    });

    it('cherche dans telephone1 ET telephone2', async () => {
      mockUtilisateurRepo.findOne.mockResolvedValue(makeMockUser());

      await service.findByTelephone('690000001');

      expect(mockUtilisateurRepo.findOne).toHaveBeenCalledWith({
        where: expect.arrayContaining([
          expect.objectContaining({ telephone1: '690000001' }),
          expect.objectContaining({ telephone2: '690000001' }),
        ]),
      });
    });
  });
});
