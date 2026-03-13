/**
 * Tests unitaires pour RegleTontineService
 */

import { createMockRepo } from '../../helpers/mock-repo';

const mockRegleTontineRepo = createMockRepo();
const mockRuleDefinitionRepo = createMockRepo();
const mockTontineRepo = createMockRepo();
const mockRegleOrgRepo = createMockRepo();

jest.mock('../../../src/config', () => ({
  AppDataSource: {
    getRepository: jest.fn((entity: any) => {
      const name = typeof entity === 'string' ? entity : entity?.name ?? String(entity);
      if (name === 'RegleTontine') return mockRegleTontineRepo;
      if (name === 'RuleDefinition') return mockRuleDefinitionRepo;
      if (name === 'Tontine') return mockTontineRepo;
      if (name === 'RegleOrganisation') return mockRegleOrgRepo;
      return createMockRepo();
    }),
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
}));

import { RegleTontineService } from '../../../src/modules/tontines/services/regle-tontine.service';

function makeMockRegle(overrides: any = {}) {
  return {
    id: 'regle-uuid-1',
    tontineId: 'tontine-uuid-1',
    ruleDefinitionId: 'ruledef-uuid-1',
    valeur: '10000',
    estActive: true,
    modifieLe: new Date(),
    ruleDefinition: { id: 'ruledef-uuid-1', cle: 'COTISATION_MENSUELLE_MIN', libelle: 'Cotisation min', estModifiableParTontine: true },
    ...overrides,
  };
}

describe('RegleTontineService', () => {
  let service: RegleTontineService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new RegleTontineService();
    mockRegleTontineRepo.create.mockImplementation((data: any) => ({ ...data }));
    mockRegleTontineRepo.save.mockImplementation((data: any) =>
      Promise.resolve({ id: 'regle-uuid-1', ...data })
    );
  });

  describe('upsert()', () => {
    it('crée si inexistante', async () => {
      mockTontineRepo.findOne.mockResolvedValue({ id: 'tontine-uuid-1' });
      mockRuleDefinitionRepo.findOne.mockResolvedValue({ id: 'ruledef-uuid-1', estModifiableParTontine: true });
      mockRegleTontineRepo.findOne
        .mockResolvedValueOnce(null)         // pas d'existante
        .mockResolvedValueOnce(makeMockRegle()); // reloaded after save

      const result = await service.upsert({
        tontineId: 'tontine-uuid-1',
        ruleDefinitionId: 'ruledef-uuid-1',
        valeur: '10000',
      });

      expect(mockRegleTontineRepo.create).toHaveBeenCalled();
      expect(result).toHaveProperty('id');
    });

    it('met à jour si existante', async () => {
      mockTontineRepo.findOne.mockResolvedValue({ id: 'tontine-uuid-1' });
      mockRuleDefinitionRepo.findOne.mockResolvedValue({ id: 'ruledef-uuid-1', estModifiableParTontine: true });
      const existante = makeMockRegle({ valeur: '5000' });
      mockRegleTontineRepo.findOne
        .mockResolvedValueOnce(existante)
        .mockResolvedValueOnce({ ...existante, valeur: '10000' });

      const result = await service.upsert({
        tontineId: 'tontine-uuid-1',
        ruleDefinitionId: 'ruledef-uuid-1',
        valeur: '10000',
      });

      expect(mockRegleTontineRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ valeur: '10000' })
      );
    });

    it('lève BadRequestError si règle non modifiable au niveau tontine', async () => {
      mockTontineRepo.findOne.mockResolvedValue({ id: 'tontine-uuid-1' });
      mockRuleDefinitionRepo.findOne.mockResolvedValue({ id: 'ruledef-uuid-1', estModifiableParTontine: false });

      await expect(
        service.upsert({ tontineId: 'tontine-uuid-1', ruleDefinitionId: 'ruledef-uuid-1', valeur: '10' })
      ).rejects.toThrow('BadRequestError');
    });

    it('lève NotFoundError si RuleDefinition inexistante', async () => {
      mockTontineRepo.findOne.mockResolvedValue({ id: 'tontine-uuid-1' });
      mockRuleDefinitionRepo.findOne.mockResolvedValue(null);

      await expect(
        service.upsert({ tontineId: 'tontine-uuid-1', ruleDefinitionId: 'unknown', valeur: '10' })
      ).rejects.toThrow('NotFoundError');
    });

    it('lève NotFoundError si Tontine inexistante', async () => {
      mockTontineRepo.findOne.mockResolvedValue(null);

      await expect(
        service.upsert({ tontineId: 'unknown', ruleDefinitionId: 'ruledef-uuid-1', valeur: '10' })
      ).rejects.toThrow('NotFoundError');
    });
  });

  describe('findByTontine()', () => {
    it('retourne toutes les règles d\'une tontine', async () => {
      mockRegleTontineRepo.find.mockResolvedValue([makeMockRegle(), makeMockRegle({ id: 'regle-uuid-2' })]);

      const result = await service.findByTontine('tontine-uuid-1');

      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(2);
    });
  });
});
