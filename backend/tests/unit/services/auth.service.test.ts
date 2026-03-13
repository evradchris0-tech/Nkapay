/**
 * Tests unitaires pour AuthService
 */

import { createMockRepo } from '../../helpers/mock-repo';

const mockUtilisateurRepo = createMockRepo();
const mockSessionRepo = createMockRepo();
const mockTentativeRepo = createMockRepo();
const mockMembreOrgRepo = createMockRepo();

jest.mock('../../../src/config/database.config', () => ({
  AppDataSource: {
    getRepository: jest.fn((entity: any) => {
      const name = typeof entity === 'string' ? entity : entity?.name ?? String(entity);
      if (name === 'Utilisateur') return mockUtilisateurRepo;
      if (name === 'SessionUtilisateur') return mockSessionRepo;
      if (name === 'TentativeConnexion') return mockTentativeRepo;
      if (name === 'MembreOrganisation') return mockMembreOrgRepo;
      return createMockRepo();
    }),
    isInitialized: true,
  },
}));

jest.mock('../../../src/shared/errors/app-error', () => ({
  UnauthorizedError: class UnauthorizedError extends Error {
    statusCode = 401;
    constructor(message: string) { super(`UnauthorizedError: ${message}`); this.name = 'UnauthorizedError'; }
  },
  NotFoundError: class NotFoundError extends Error {
    statusCode = 404;
    constructor(message: string) { super(`NotFoundError: ${message}`); this.name = 'NotFoundError'; }
  },
}));

jest.mock('../../../src/modules/auth/utils/password.util', () => ({
  verifyPassword: jest.fn().mockResolvedValue(true),
  hashPassword: jest.fn().mockResolvedValue('hashed'),
}));

jest.mock('../../../src/modules/auth/utils/jwt.util', () => ({
  generateAccessToken: jest.fn().mockReturnValue('access-token-mock'),
  generateRefreshToken: jest.fn().mockReturnValue('refresh-token-mock'),
  verifyToken: jest.fn().mockReturnValue({ sub: 'user-uuid-1' }),
  hashToken: jest.fn((t: string) => `hashed:${t}`),
  parseExpiresIn: jest.fn().mockReturnValue(3600),
  getExpirationDate: jest.fn().mockReturnValue(new Date(Date.now() + 3600000)),
}));

jest.mock('../../../src/config/env.config', () => ({
  env: {
    jwt: { accessExpiresIn: '1h', refreshExpiresIn: '7d' },
    nodeEnv: 'test',
    db: {},
  },
  isDevelopment: false,
}));

import { AuthService } from '../../../src/modules/auth/services/auth.service';

function makeMockUser(overrides: any = {}) {
  return {
    id: 'user-uuid-1',
    prenom: 'Jean',
    nom: 'Dupont',
    telephone1: '690000001',
    telephone2: null,
    passwordHash: 'hashed-password',
    estSuperAdmin: false,
    doitChangerMotDePasse: false,
    ...overrides,
  };
}

function makeMockSession(overrides: any = {}) {
  return {
    id: 'session-uuid-1',
    utilisateurId: 'user-uuid-1',
    tokenHash: 'hashed:access-token-mock',
    refreshTokenHash: 'hashed:refresh-token-mock',
    estActive: true,
    expirationDate: new Date(Date.now() + 3600000),
    ...overrides,
  };
}

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AuthService();

    mockTentativeRepo.create.mockImplementation((data: any) => ({ ...data }));
    mockTentativeRepo.save.mockResolvedValue({});
    mockSessionRepo.create.mockImplementation((data: any) => ({ ...data }));
    mockSessionRepo.save.mockImplementation((data: any) => Promise.resolve({ id: 'session-uuid-1', ...data }));
    mockMembreOrgRepo.find.mockResolvedValue([]);
  });

  describe('login()', () => {
    it('retourne accessToken + refreshToken sur credentials valides', async () => {
      mockUtilisateurRepo.findOne.mockResolvedValue(makeMockUser());

      const result = await service.login({ identifiant: '690000001', motDePasse: 'password123' }, '127.0.0.1');

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.accessToken).toBe('access-token-mock');
    });

    it('lève UnauthorizedError si téléphone non trouvé', async () => {
      mockUtilisateurRepo.findOne.mockResolvedValue(null);

      await expect(
        service.login({ identifiant: '000000000', motDePasse: 'pass' }, '127.0.0.1')
      ).rejects.toThrow('UnauthorizedError');
    });

    it('lève UnauthorizedError si mot de passe incorrect', async () => {
      mockUtilisateurRepo.findOne.mockResolvedValue(makeMockUser());
      const { verifyPassword } = require('../../../src/modules/auth/utils/password.util');
      verifyPassword.mockResolvedValueOnce(false);

      await expect(
        service.login({ identifiant: '690000001', motDePasse: 'wrong' }, '127.0.0.1')
      ).rejects.toThrow('UnauthorizedError');
    });

    it('enregistre une tentative sur échec', async () => {
      mockUtilisateurRepo.findOne.mockResolvedValue(null);

      try {
        await service.login({ identifiant: '000000000', motDePasse: 'pass' }, '127.0.0.1');
      } catch {
        // expected
      }

      expect(mockTentativeRepo.save).toHaveBeenCalled();
    });

    it('normalise le format +237 du téléphone', async () => {
      mockUtilisateurRepo.findOne.mockResolvedValue(makeMockUser());

      await service.login({ identifiant: '+237690000001', motDePasse: 'password' }, '127.0.0.1');

      expect(mockUtilisateurRepo.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.arrayContaining([
            expect.objectContaining({ telephone1: '+237690000001' }),
          ]),
        })
      );
    });

    it('inclut les organisations dans la réponse', async () => {
      mockUtilisateurRepo.findOne.mockResolvedValue(makeMockUser());
      mockMembreOrgRepo.find.mockResolvedValue([
        {
          utilisateurId: 'user-uuid-1',
          role: 'ORG_ADMIN',
          statut: 'ACTIVE',
          organisation: { id: 'org-uuid-1', nom: 'Org Test', slug: 'org-test', statut: 'ACTIVE' },
        },
      ]);

      const result = await service.login({ identifiant: '690000001', motDePasse: 'pass' }, '127.0.0.1');

      expect((result as any).organisations).toHaveLength(1);
    });
  });

  describe('logout()', () => {
    it('révoque la session active', async () => {
      mockSessionRepo.findOne.mockResolvedValue(makeMockSession());

      await service.logout('user-uuid-1', 'access-token-mock');

      expect(mockSessionRepo.update).toHaveBeenCalled();
    });
  });
});
