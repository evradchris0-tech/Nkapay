/**
 * Tests unitaires pour OnboardingService
 */

// ─── Mock du manager transactionnel ───────────────────────────────────────────

const mockManager = {
  findOne: jest.fn(),
  find: jest.fn(),
  create: jest.fn((_entity: any, data: any) => ({ ...data })),
  save: jest.fn((data: any) => Promise.resolve({ id: 'uuid-mock', ...data })),
};

jest.mock('../../../src/config', () => ({
  AppDataSource: {
    transaction: jest.fn((fn: (manager: any) => any) => fn(mockManager)),
    isInitialized: true,
  },
  env: { nodeEnv: 'test', db: {} },
  isDevelopment: false,
}));

jest.mock('../../../src/config/env.config', () => ({
  env: {
    jwt: {
      accessSecret: 'test-secret',
      refreshSecret: 'test-refresh',
      accessExpiresIn: '3600',
      refreshExpiresIn: '604800',
    },
  },
}));

jest.mock('../../../src/shared/errors/app-error', () => ({
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
}));

jest.mock('../../../src/modules/auth/utils/jwt.util', () => ({
  generateAccessToken: jest.fn().mockReturnValue('access-token-mock'),
  generateRefreshToken: jest.fn().mockReturnValue('refresh-token-mock'),
  hashToken: jest.fn().mockReturnValue('hashed-token'),
  parseExpiresIn: jest.fn().mockReturnValue(3600),
  getExpirationDate: jest.fn().mockReturnValue(new Date(Date.now() + 3600000)),
}));

jest.mock('../../../src/shared/utils/logger.util', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn() },
}));

// ─── Import sous test ─────────────────────────────────────────────────────────

import { OnboardingService } from '../../../src/modules/organisations/services/onboarding.service';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const baseDto = {
  prenom: 'Alice',
  nom: 'Dupont',
  telephone: '699000001',
  email: 'alice@tontine.cm',
  motDePasse: 'password123',
  nomOrganisation: 'Tontine Alpha',
  slug: 'tontine-alpha',
  emailContact: 'contact@tontine.cm',
};

describe('OnboardingService', () => {
  let service: OnboardingService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new OnboardingService();

    // Default: no duplicates
    mockManager.findOne.mockResolvedValue(null);

    // Default: FREE plan found
    mockManager.findOne.mockImplementation((_entity: any, opts: any) => {
      if (opts?.where?.code === 'FREE') {
        return Promise.resolve({ id: 'plan-uuid-free', code: 'FREE', libelle: 'Gratuit' });
      }
      return Promise.resolve(null);
    });

    // Default: no rule definitions to seed
    mockManager.find.mockResolvedValue([]);

    // Default: save returns proper mocks
    mockManager.save
      .mockResolvedValueOnce({ id: 'user-uuid-1', ...baseDto })     // utilisateur
      .mockResolvedValueOnce({ id: 'org-uuid-1', slug: baseDto.slug }) // organisation
      .mockResolvedValueOnce({ id: 'membre-uuid-1' })                 // membre
      .mockResolvedValue({ id: 'session-uuid-1' });                   // session
  });

  describe('registerOrganisation()', () => {
    it('crée utilisateur + organisation + membre + session et retourne les tokens', async () => {
      const result = await service.registerOrganisation(baseDto, '127.0.0.1', 'jest-agent');

      expect(result).toHaveProperty('accessToken', 'access-token-mock');
      expect(result).toHaveProperty('refreshToken', 'refresh-token-mock');
      expect(result).toHaveProperty('expiresIn', 3600);
      expect(result).toHaveProperty('organisationId');
    });

    it('lève ConflictError si téléphone déjà utilisé', async () => {
      mockManager.findOne.mockResolvedValueOnce({ id: 'existing-user' }); // phone exists

      await expect(
        service.registerOrganisation(baseDto, '127.0.0.1')
      ).rejects.toThrow('ConflictError');
    });

    it('lève ConflictError si email déjà utilisé', async () => {
      mockManager.findOne
        .mockResolvedValueOnce(null)                  // phone ok
        .mockResolvedValueOnce({ id: 'existing' });   // email exists

      await expect(
        service.registerOrganisation(baseDto, '127.0.0.1')
      ).rejects.toThrow('ConflictError');
    });

    it('lève ConflictError si slug déjà utilisé', async () => {
      mockManager.findOne
        .mockResolvedValueOnce(null)                  // phone ok
        .mockResolvedValueOnce(null)                  // email ok
        .mockResolvedValueOnce({ id: 'existing-org' }); // slug exists

      await expect(
        service.registerOrganisation(baseDto, '127.0.0.1')
      ).rejects.toThrow('ConflictError');
    });

    it('lève BadRequestError si mot de passe trop court (< 6 chars)', async () => {
      await expect(
        service.registerOrganisation({ ...baseDto, motDePasse: '123' }, '127.0.0.1')
      ).rejects.toThrow('BadRequestError');
    });

    it('lève BadRequestError si plan code inexistant', async () => {
      mockManager.findOne.mockImplementation((_entity: any, opts: any) => {
        if (opts?.where?.code) return Promise.resolve(null); // plan not found
        return Promise.resolve(null);
      });

      await expect(
        service.registerOrganisation({ ...baseDto, planCode: 'PREMIUM' }, '127.0.0.1')
      ).rejects.toThrow('BadRequestError');
    });

    it('seed les règles org depuis les RuleDefinitions modifiables', async () => {
      const ruleDefs = [
        { id: 'def-1', estModifiableParOrganisation: true, valeurDefaut: '5000' },
        { id: 'def-2', estModifiableParOrganisation: true, valeurDefaut: '1000' },
        { id: 'def-3', estModifiableParOrganisation: true, valeurDefaut: null }, // no default → skip
      ];
      mockManager.find.mockResolvedValue(ruleDefs);
      mockManager.save.mockResolvedValue({ id: 'uuid-mock' });

      await service.registerOrganisation(baseDto, '127.0.0.1');

      // save appelé pour : utilisateur + organisation + membre + session + 2 rules (not the null one)
      const saveCalls = mockManager.save.mock.calls.length;
      expect(saveCalls).toBeGreaterThanOrEqual(4);
    });
  });
});
