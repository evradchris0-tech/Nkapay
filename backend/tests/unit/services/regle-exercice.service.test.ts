/**
 * Tests unitaires pour RegleExerciceService
 */

import { createMockRepo } from '../../helpers/mock-repo';

const mockRegleExerciceRepo = createMockRepo();
const mockRuleDefinitionRepo = createMockRepo();
const mockRegleTontineRepo = createMockRepo();
const mockRegleOrgRepo = createMockRepo();
const mockTontineRepo = createMockRepo();
const mockExerciceRepo = createMockRepo();

jest.mock('../../../src/config', () => ({
  AppDataSource: {
    getRepository: jest.fn((entity: any) => {
      const name = typeof entity === 'string' ? entity : entity?.name ?? String(entity);
      if (name === 'RegleExercice') return mockRegleExerciceRepo;
      if (name === 'RuleDefinition') return mockRuleDefinitionRepo;
      if (name === 'RegleTontine') return mockRegleTontineRepo;
      if (name === 'RegleOrganisation') return mockRegleOrgRepo;
      if (name === 'Tontine') return mockTontineRepo;
      if (name === 'Exercice') return mockExerciceRepo;
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

import { RegleExerciceService } from '../../../src/modules/exercices/services/regle-exercice.service';

function makeMockRegleExercice(overrides: any = {}) {
  return {
    id: 'regle-ex-uuid-1',
    exerciceId: 'exercice-uuid-1',
    ruleDefinitionId: 'ruledef-uuid-1',
    valeur: '15000',
    estSurchargee: true,
    modifieLe: new Date(),
    creeLe: new Date(),
    ruleDefinition: {
      id: 'ruledef-uuid-1',
      cle: 'COTISATION_MENSUELLE_MIN',
      libelle: 'Cotisation min',
      typeValeur: 'NUMBER',
      categorie: 'COTISATION',
    },
    ...overrides,
  };
}

function makeMockRuleDef(overrides: any = {}) {
  return {
    id: 'ruledef-uuid-1',
    cle: 'COTISATION_MENSUELLE_MIN',
    libelle: 'Cotisation min',
    typeValeur: 'NUMBER',
    categorie: 'COTISATION',
    valeurDefaut: '10000',
    estModifiableParExercice: true,
    ordreAffichage: 1,
    ...overrides,
  };
}

describe('RegleExerciceService', () => {
  let service: RegleExerciceService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new RegleExerciceService();
    mockRegleExerciceRepo.create.mockImplementation((data: any) => ({ ...data }));
    mockRegleExerciceRepo.save.mockImplementation((data: any) =>
      Promise.resolve({ id: 'regle-ex-uuid-1', ...data })
    );
  });

  describe('upsert()', () => {
    it('crée une règle si inexistante', async () => {
      mockExerciceRepo.findOne.mockResolvedValue({ id: 'exercice-uuid-1' });
      mockRuleDefinitionRepo.findOne.mockResolvedValue(makeMockRuleDef());
      mockRegleExerciceRepo.findOne
        .mockResolvedValueOnce(null)               // pas d'existante
        .mockResolvedValueOnce(makeMockRegleExercice()); // reloaded after save

      const result = await service.upsert({
        exerciceId: 'exercice-uuid-1',
        ruleDefinitionId: 'ruledef-uuid-1',
        valeur: '15000',
      });

      expect(mockRegleExerciceRepo.create).toHaveBeenCalled();
      expect(result).toHaveProperty('id');
    });

    it('met à jour si existante', async () => {
      mockExerciceRepo.findOne.mockResolvedValue({ id: 'exercice-uuid-1' });
      mockRuleDefinitionRepo.findOne.mockResolvedValue(makeMockRuleDef());
      const existing = makeMockRegleExercice({ valeur: '10000' });
      mockRegleExerciceRepo.findOne
        .mockResolvedValueOnce(existing)
        .mockResolvedValueOnce({ ...existing, valeur: '20000' });

      const result = await service.upsert({
        exerciceId: 'exercice-uuid-1',
        ruleDefinitionId: 'ruledef-uuid-1',
        valeur: '20000',
      });

      expect(mockRegleExerciceRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ valeur: '20000' })
      );
    });

    it('lève BadRequestError si règle non modifiable au niveau exercice', async () => {
      mockExerciceRepo.findOne.mockResolvedValue({ id: 'exercice-uuid-1' });
      mockRuleDefinitionRepo.findOne.mockResolvedValue(
        makeMockRuleDef({ estModifiableParExercice: false })
      );

      await expect(
        service.upsert({ exerciceId: 'exercice-uuid-1', ruleDefinitionId: 'ruledef-uuid-1', valeur: '10' })
      ).rejects.toThrow('BadRequestError');
    });

    it('lève NotFoundError si exercice inexistant', async () => {
      mockExerciceRepo.findOne.mockResolvedValue(null);

      await expect(
        service.upsert({ exerciceId: 'unknown', ruleDefinitionId: 'ruledef-uuid-1', valeur: '10' })
      ).rejects.toThrow('NotFoundError');
    });

    it('lève NotFoundError si RuleDefinition inexistante', async () => {
      mockExerciceRepo.findOne.mockResolvedValue({ id: 'exercice-uuid-1' });
      mockRuleDefinitionRepo.findOne.mockResolvedValue(null);

      await expect(
        service.upsert({ exerciceId: 'exercice-uuid-1', ruleDefinitionId: 'unknown', valeur: '10' })
      ).rejects.toThrow('NotFoundError');
    });
  });

  describe('getEffectiveValueByCle() — cascade 4 niveaux', () => {
    const exercice = { id: 'exercice-uuid-1', tontineId: 'tontine-uuid-1' };
    const ruleDef = makeMockRuleDef({ valeurDefaut: '5000' });

    it('retourne la valeur exercice si surchargée (niveau 1)', async () => {
      mockExerciceRepo.findOne.mockResolvedValue(exercice);
      mockRuleDefinitionRepo.findOne.mockResolvedValue(ruleDef);
      mockRegleExerciceRepo.findOne.mockResolvedValue({ valeur: '20000', estSurchargee: true });

      const result = await service.getEffectiveValueByCle('exercice-uuid-1', 'COTISATION_MENSUELLE_MIN');

      expect(result).toBe('20000');
    });

    it('retourne la valeur tontine si pas de surcharge exercice (niveau 2)', async () => {
      mockExerciceRepo.findOne.mockResolvedValue(exercice);
      mockRuleDefinitionRepo.findOne.mockResolvedValue(ruleDef);
      mockRegleExerciceRepo.findOne.mockResolvedValue({ valeur: '15000', estSurchargee: false });
      mockRegleTontineRepo.findOne.mockResolvedValue({ valeur: '12000', estActive: true });

      const result = await service.getEffectiveValueByCle('exercice-uuid-1', 'COTISATION_MENSUELLE_MIN');

      expect(result).toBe('12000');
    });

    it('retourne la valeur organisation si pas de règle tontine (niveau 3)', async () => {
      mockExerciceRepo.findOne.mockResolvedValue(exercice);
      mockRuleDefinitionRepo.findOne.mockResolvedValue(ruleDef);
      mockRegleExerciceRepo.findOne.mockResolvedValue(null);
      mockRegleTontineRepo.findOne.mockResolvedValue(null);
      mockTontineRepo.findOne.mockResolvedValue({ id: 'tontine-uuid-1', organisationId: 'org-uuid-1' });
      mockRegleOrgRepo.findOne.mockResolvedValue({ valeur: '8000' });

      const result = await service.getEffectiveValueByCle('exercice-uuid-1', 'COTISATION_MENSUELLE_MIN');

      expect(result).toBe('8000');
    });

    it('retourne le défaut global si aucun niveau ne surcharge (niveau 4)', async () => {
      mockExerciceRepo.findOne.mockResolvedValue(exercice);
      mockRuleDefinitionRepo.findOne.mockResolvedValue(ruleDef);
      mockRegleExerciceRepo.findOne.mockResolvedValue(null);
      mockRegleTontineRepo.findOne.mockResolvedValue(null);
      mockTontineRepo.findOne.mockResolvedValue({ id: 'tontine-uuid-1', organisationId: null });

      const result = await service.getEffectiveValueByCle('exercice-uuid-1', 'COTISATION_MENSUELLE_MIN');

      expect(result).toBe('5000'); // valeurDefaut
    });

    it('retourne null si exercice inexistant', async () => {
      mockExerciceRepo.findOne.mockResolvedValue(null);

      const result = await service.getEffectiveValueByCle('unknown', 'COTISATION_MENSUELLE_MIN');

      expect(result).toBeNull();
    });

    it('retourne null si cle inexistante', async () => {
      mockExerciceRepo.findOne.mockResolvedValue(exercice);
      mockRuleDefinitionRepo.findOne.mockResolvedValue(null);

      const result = await service.getEffectiveValueByCle('exercice-uuid-1', 'UNKNOWN_KEY');

      expect(result).toBeNull();
    });
  });

  describe('initializeFromTontine()', () => {
    it('copie les règles actives de la tontine vers l\'exercice', async () => {
      const tontineRules = [
        { id: 'rt-1', ruleDefinitionId: 'ruledef-uuid-1', valeur: '10000', estActive: true },
        { id: 'rt-2', ruleDefinitionId: 'ruledef-uuid-2', valeur: '500', estActive: true },
      ];
      mockRegleTontineRepo.find.mockResolvedValue(tontineRules);

      await service.initializeFromTontine('exercice-uuid-1', 'tontine-uuid-1');

      expect(mockRegleExerciceRepo.save).toHaveBeenCalledTimes(2);
      expect(mockRegleExerciceRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ exerciceId: 'exercice-uuid-1', estSurchargee: false })
      );
    });

    it('ne crée rien si la tontine n\'a pas de règles', async () => {
      mockRegleTontineRepo.find.mockResolvedValue([]);

      await service.initializeFromTontine('exercice-uuid-1', 'tontine-uuid-1');

      expect(mockRegleExerciceRepo.save).not.toHaveBeenCalled();
    });
  });

  describe('findByExercice()', () => {
    it('retourne toutes les règles d\'un exercice', async () => {
      mockRegleExerciceRepo.find.mockResolvedValue([
        makeMockRegleExercice(),
        makeMockRegleExercice({ id: 'regle-ex-uuid-2' }),
      ]);

      const result = await service.findByExercice('exercice-uuid-1');

      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(2);
    });
  });
});
