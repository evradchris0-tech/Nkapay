/**
 * Tests unitaires pour PretService
 */

import { createMockRepo } from '../../helpers/mock-repo';

// ─── Mocks modules ────────────────────────────────────────────────────────────

const mockPretRepo = createMockRepo();
const mockExerciceMembreRepo = createMockRepo();
const mockReunionRepo = createMockRepo();

jest.mock('../../../src/config', () => ({
  AppDataSource: {
    getRepository: jest.fn((entity: any) => {
      const name = typeof entity === 'string' ? entity : entity?.name ?? String(entity);
      if (name === 'Pret') return mockPretRepo;
      if (name === 'ExerciceMembre') return mockExerciceMembreRepo;
      if (name === 'Reunion') return mockReunionRepo;
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

const mockRegleExerciceService = {
  getEffectiveValueByCle: jest.fn().mockResolvedValue(null),
};
jest.mock('../../../src/modules/exercices/services/regle-exercice.service', () => ({
  regleExerciceService: mockRegleExerciceService,
}));

// ─── Import sous test ─────────────────────────────────────────────────────────

import { PretService } from '../../../src/modules/prets/services/pret.service';
import { StatutPret } from '../../../src/modules/prets/entities/pret.entity';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeMockPret(overrides: any = {}) {
  return {
    id: 'pret-uuid-1',
    exerciceMembreId: 'em-uuid-1',
    reunionId: 'reunion-uuid-1',
    montantCapital: 100000,
    tauxInteret: 0.05,
    montantInteret: 5000,
    montantTotalDu: 105000,
    dureeMois: 12,
    capitalRestant: 100000,
    statut: StatutPret.DEMANDE,
    dateDemande: new Date(),
    dateApprobation: null,
    dateDecaissement: null,
    dateEcheance: null,
    dateSolde: null,
    exerciceMembre: null,
    remboursements: [],
    ...overrides,
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('PretService', () => {
  let service: PretService;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRegleExerciceService.getEffectiveValueByCle.mockReset();
    service = new PretService();

    mockPretRepo.create.mockImplementation((data: any) => ({ ...data }));
    mockPretRepo.save.mockImplementation((data: any) =>
      Promise.resolve({ id: 'pret-uuid-1', ...data })
    );
  });

  // ─────────────────────────────────────────────────────────────────────────
  // create()
  // ─────────────────────────────────────────────────────────────────────────

  describe('create()', () => {
    it('crée avec statut DEMANDE', async () => {
      mockExerciceMembreRepo.findOne.mockResolvedValue({ id: 'em-uuid-1', exerciceId: 'exo-1' });
      mockReunionRepo.findOne.mockResolvedValue({ id: 'reunion-uuid-1' });
      mockPretRepo.findOne.mockResolvedValue(makeMockPret());

      const dto = {
        exerciceMembreId: 'em-uuid-1',
        reunionId: 'reunion-uuid-1',
        montantCapital: 100000,
        dureeMois: 12,
      };

      const result = await service.create(dto);

      expect(mockPretRepo.save).toHaveBeenCalled();
      expect(result).toHaveProperty('id');
    });

    it('lève NotFoundError si ExerciceMembre inexistant', async () => {
      mockExerciceMembreRepo.findOne.mockResolvedValue(null);

      await expect(
        service.create({ exerciceMembreId: 'em-unknown', reunionId: 'r-1', montantCapital: 50000, dureeMois: 6 })
      ).rejects.toThrow('NotFoundError');
    });

    it('lève NotFoundError si Reunion inexistante', async () => {
      mockExerciceMembreRepo.findOne.mockResolvedValue({ id: 'em-uuid-1', exerciceId: 'exo-1' });
      mockReunionRepo.findOne.mockResolvedValue(null);

      await expect(
        service.create({ exerciceMembreId: 'em-uuid-1', reunionId: 'r-unknown', montantCapital: 50000, dureeMois: 6 })
      ).rejects.toThrow('NotFoundError');
    });

    it('respecte PRET_DUREE_MAX — lève BadRequestError si durée trop longue', async () => {
      mockExerciceMembreRepo.findOne.mockResolvedValue({ id: 'em-uuid-1', exerciceId: 'exo-1' });
      mockReunionRepo.findOne.mockResolvedValue({ id: 'reunion-uuid-1' });
      mockRegleExerciceService.getEffectiveValueByCle
        .mockResolvedValueOnce(null) // PRET_TAUX_INTERET
        .mockResolvedValueOnce('6')  // PRET_DUREE_MAX = 6 mois
        .mockResolvedValueOnce(null); // PRET_PLAFOND_MONTANT

      await expect(
        service.create({ exerciceMembreId: 'em-uuid-1', reunionId: 'r-1', montantCapital: 50000, dureeMois: 12 })
      ).rejects.toThrow('BadRequestError');
    });

    it('respecte PRET_PLAFOND_MONTANT — lève BadRequestError si montant trop élevé', async () => {
      mockExerciceMembreRepo.findOne.mockResolvedValue({ id: 'em-uuid-1', exerciceId: 'exo-1' });
      mockReunionRepo.findOne.mockResolvedValue({ id: 'reunion-uuid-1' });
      mockRegleExerciceService.getEffectiveValueByCle
        .mockResolvedValueOnce(null)      // PRET_TAUX_INTERET
        .mockResolvedValueOnce(null)      // PRET_DUREE_MAX
        .mockResolvedValueOnce('50000');  // PRET_PLAFOND_MONTANT = 50000

      await expect(
        service.create({ exerciceMembreId: 'em-uuid-1', reunionId: 'r-1', montantCapital: 100000, dureeMois: 6 })
      ).rejects.toThrow('BadRequestError');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // approuver()
  // ─────────────────────────────────────────────────────────────────────────

  describe('approuver()', () => {
    it('DEMANDE → APPROUVE', async () => {
      const pret = makeMockPret({ statut: StatutPret.DEMANDE });
      mockPretRepo.findOne
        .mockResolvedValueOnce(pret)
        .mockResolvedValueOnce({ ...pret, statut: StatutPret.APPROUVE });

      await service.approuver('pret-uuid-1', { approuveParExerciceMembreId: 'em-admin-1' });

      expect(mockPretRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ statut: StatutPret.APPROUVE })
      );
    });

    it('lève une erreur si pas en DEMANDE', async () => {
      const pret = makeMockPret({ statut: StatutPret.REFUSE });
      mockPretRepo.findOne.mockResolvedValue(pret);

      await expect(
        service.approuver('pret-uuid-1', { approuveParExerciceMembreId: 'em-admin-1' })
      ).rejects.toThrow();
    });

    it('lève NotFoundError si pret inexistant', async () => {
      mockPretRepo.findOne.mockResolvedValue(null);

      await expect(
        service.approuver('unknown-id', { approuveParExerciceMembreId: 'em-admin-1' })
      ).rejects.toThrow('NotFoundError');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // refuser()
  // ─────────────────────────────────────────────────────────────────────────

  describe('refuser()', () => {
    it('DEMANDE → REFUSE avec motif', async () => {
      const pret = makeMockPret({ statut: StatutPret.DEMANDE });
      mockPretRepo.findOne
        .mockResolvedValueOnce(pret)
        .mockResolvedValueOnce({ ...pret, statut: StatutPret.REFUSE });

      await service.refuser('pret-uuid-1', { motifRefus: 'Insuffisance de garanties', rejeteParExerciceMembreId: 'em-admin-1' });

      expect(mockPretRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ statut: StatutPret.REFUSE, motifRefus: 'Insuffisance de garanties' })
      );
    });

    it('lève NotFoundError si pret inexistant', async () => {
      mockPretRepo.findOne.mockResolvedValue(null);

      await expect(service.refuser('unknown-id', { motifRefus: 'Raison', rejeteParExerciceMembreId: 'em-admin-1' })).rejects.toThrow('NotFoundError');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // decaisser()
  // ─────────────────────────────────────────────────────────────────────────

  describe('decaisser()', () => {
    it('APPROUVE → DECAISSE → EN_COURS (2 saves)', async () => {
      const pret = makeMockPret({ statut: StatutPret.APPROUVE, dureeMois: 6 });
      mockPretRepo.findOne
        .mockResolvedValueOnce(pret)
        .mockResolvedValueOnce({ ...pret, statut: StatutPret.EN_COURS });

      await service.decaisser('pret-uuid-1', {});

      expect(mockPretRepo.save).toHaveBeenCalledTimes(2);
    });

    it('lève une erreur si pas APPROUVE', async () => {
      const pret = makeMockPret({ statut: StatutPret.DEMANDE });
      mockPretRepo.findOne.mockResolvedValue(pret);

      await expect(service.decaisser('pret-uuid-1', {})).rejects.toThrow();
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // findAll()
  // ─────────────────────────────────────────────────────────────────────────

  describe('findAll()', () => {
    it('retourne des résultats paginés', async () => {
      const qb = mockPretRepo.createQueryBuilder();
      qb.getCount.mockResolvedValue(0);
      qb.getRawAndEntities.mockResolvedValue({ entities: [], raw: [] });

      const result = await service.findAll({}, { page: 1, limit: 10 });

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('meta');
      expect(Array.isArray(result.data)).toBe(true);
    });

    it('filtre par exerciceId', async () => {
      const qb = mockPretRepo.createQueryBuilder();
      qb.getCount.mockResolvedValue(0);
      qb.getRawAndEntities.mockResolvedValue({ entities: [], raw: [] });

      await service.findAll({ exerciceId: 'exo-uuid-1' });

      expect(qb.andWhere).toHaveBeenCalledWith(
        expect.stringContaining('exerciceId'),
        expect.any(Object)
      );
    });

    it('filtre par statut', async () => {
      const qb = mockPretRepo.createQueryBuilder();
      qb.getCount.mockResolvedValue(0);
      qb.getRawAndEntities.mockResolvedValue({ entities: [], raw: [] });

      await service.findAll({ statut: StatutPret.EN_COURS });

      expect(qb.andWhere).toHaveBeenCalledWith(
        expect.stringContaining('statut'),
        expect.any(Object)
      );
    });
  });
});
