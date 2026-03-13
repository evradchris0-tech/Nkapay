/**
 * Tests unitaires pour ReunionService
 */

import { createMockRepo } from '../../helpers/mock-repo';

// ─── Mocks modules ────────────────────────────────────────────────────────────

const mockReunionRepo = createMockRepo();
const mockExerciceRepo = createMockRepo();
const mockExerciceMembreRepo = createMockRepo();
const mockPresenceRepo = createMockRepo();

jest.mock('../../../src/config', () => ({
  AppDataSource: {
    getRepository: jest.fn((entity: any) => {
      const name = typeof entity === 'string' ? entity : entity?.name ?? String(entity);
      if (name === 'Reunion') return mockReunionRepo;
      if (name === 'Exercice') return mockExerciceRepo;
      if (name === 'ExerciceMembre') return mockExerciceMembreRepo;
      if (name === 'PresenceReunion') return mockPresenceRepo;
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

jest.mock('../../../src/modules/transactions/services/cotisation-due.service', () => ({
  cotisationDueService: { genererPourReunion: jest.fn().mockResolvedValue(undefined) },
}));
jest.mock('../../../src/modules/transactions/services/pot-du.service', () => ({
  potDuService: { genererPourReunion: jest.fn().mockResolvedValue(undefined) },
}));
jest.mock('../../../src/modules/transactions/services/epargne-due.service', () => ({
  epargneDueService: { genererPourReunion: jest.fn().mockResolvedValue(undefined) },
}));
jest.mock('../../../src/modules/exercices/services/regle-exercice.service', () => ({
  regleExerciceService: { getEffectiveValueByCle: jest.fn().mockResolvedValue(null) },
}));

// ─── Import sous test ─────────────────────────────────────────────────────────

import { ReunionService } from '../../../src/modules/reunions/services/reunion.service';
import { StatutReunion } from '../../../src/modules/reunions/entities/reunion.entity';
import { StatutExercice } from '../../../src/modules/exercices/entities/exercice.entity';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeMockReunion(overrides: any = {}) {
  return {
    id: 'reunion-uuid-1',
    exerciceId: 'exercice-uuid-1',
    numeroReunion: 1,
    dateReunion: new Date('2024-01-15'),
    heureDebut: '18:00',
    lieu: 'Domicile du président',
    hoteExerciceMembreId: null,
    statut: StatutReunion.PLANIFIEE,
    ouverteLe: null,
    clotureeLe: null,
    clotureeParExerciceMembreId: null,
    hote: null,
    presences: [],
    creeLe: new Date(),
    modifieLe: null,
    ...overrides,
  };
}

function makeMockExercice(overrides: any = {}) {
  return {
    id: 'exercice-uuid-1',
    tontineId: 'tontine-uuid-1',
    statut: StatutExercice.OUVERT,
    ...overrides,
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('ReunionService', () => {
  let service: ReunionService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ReunionService();

    mockReunionRepo.create.mockImplementation((data: any) => ({ ...data }));
    mockReunionRepo.save.mockImplementation((data: any) =>
      Promise.resolve({ id: 'reunion-uuid-1', ...data })
    );
    mockPresenceRepo.create.mockImplementation((data: any) => ({ ...data }));
    mockPresenceRepo.save.mockResolvedValue([]);
    mockPresenceRepo.find.mockResolvedValue([]);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // planifier()
  // ─────────────────────────────────────────────────────────────────────────

  describe('planifier()', () => {
    it('crée en statut PLANIFIEE', async () => {
      mockExerciceRepo.findOne.mockResolvedValue(makeMockExercice());
      mockReunionRepo.findOne
        .mockResolvedValueOnce(null) // unicité numero
        .mockResolvedValueOnce(makeMockReunion()); // findById

      const dto = {
        exerciceId: 'exercice-uuid-1',
        numeroReunion: 1,
        dateReunion: '2024-01-15',
      };

      const result = await service.planifier(dto);

      expect(mockReunionRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ statut: StatutReunion.PLANIFIEE })
      );
      expect(result).toHaveProperty('id');
    });

    it('lève NotFoundError si exercice inexistant', async () => {
      mockExerciceRepo.findOne.mockResolvedValue(null);

      await expect(
        service.planifier({ exerciceId: 'exo-unknown', numeroReunion: 1, dateReunion: '2024-01-15' })
      ).rejects.toThrow('NotFoundError');
    });

    it('lève BadRequestError si exercice pas OUVERT', async () => {
      mockExerciceRepo.findOne.mockResolvedValue(makeMockExercice({ statut: StatutExercice.BROUILLON }));

      await expect(
        service.planifier({ exerciceId: 'exercice-uuid-1', numeroReunion: 1, dateReunion: '2024-01-15' })
      ).rejects.toThrow('BadRequestError');
    });

    it('lève BadRequestError si numéro réunion dupliqué', async () => {
      mockExerciceRepo.findOne.mockResolvedValue(makeMockExercice());
      mockReunionRepo.findOne.mockResolvedValueOnce(makeMockReunion()); // exists

      await expect(
        service.planifier({ exerciceId: 'exercice-uuid-1', numeroReunion: 1, dateReunion: '2024-01-15' })
      ).rejects.toThrow('BadRequestError');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // ouvrir()
  // ─────────────────────────────────────────────────────────────────────────

  describe('ouvrir()', () => {
    it('PLANIFIEE → OUVERTE', async () => {
      const planifiee = makeMockReunion({ statut: StatutReunion.PLANIFIEE });
      mockReunionRepo.findOne
        .mockResolvedValueOnce(planifiee)   // in ouvrir()
        .mockResolvedValueOnce({ ...planifiee, statut: StatutReunion.OUVERTE, presences: [] }); // findById
      mockExerciceMembreRepo.find.mockResolvedValue([]);

      await service.ouvrir('reunion-uuid-1');

      expect(mockReunionRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ statut: StatutReunion.OUVERTE })
      );
    });

    it('crée les enregistrements de présence pour les membres actifs', async () => {
      const planifiee = makeMockReunion({ statut: StatutReunion.PLANIFIEE });
      mockReunionRepo.findOne
        .mockResolvedValueOnce(planifiee)
        .mockResolvedValueOnce({ ...planifiee, statut: StatutReunion.OUVERTE, presences: [] });

      const membres = [
        { id: 'em-1', exerciceId: 'exercice-uuid-1' },
        { id: 'em-2', exerciceId: 'exercice-uuid-1' },
      ];
      mockExerciceMembreRepo.find.mockResolvedValue(membres);

      await service.ouvrir('reunion-uuid-1');

      expect(mockPresenceRepo.save).toHaveBeenCalled();
    });

    it('lève BadRequestError si pas PLANIFIEE', async () => {
      mockReunionRepo.findOne.mockResolvedValueOnce(
        makeMockReunion({ statut: StatutReunion.OUVERTE })
      );

      await expect(service.ouvrir('reunion-uuid-1')).rejects.toThrow('BadRequestError');
    });

    it('lève NotFoundError si reunion inexistante', async () => {
      mockReunionRepo.findOne.mockResolvedValueOnce(null);

      await expect(service.ouvrir('unknown-id')).rejects.toThrow('NotFoundError');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // cloturer()
  // ─────────────────────────────────────────────────────────────────────────

  describe('cloturer()', () => {
    it('OUVERTE → CLOTUREE', async () => {
      const ouverte = makeMockReunion({ statut: StatutReunion.OUVERTE });
      mockReunionRepo.findOne
        .mockResolvedValueOnce(ouverte)
        .mockResolvedValueOnce({ ...ouverte, statut: StatutReunion.CLOTUREE, presences: [] });

      await service.cloturer('reunion-uuid-1', { clotureeParExerciceMembreId: 'em-admin-1' });

      expect(mockReunionRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ statut: StatutReunion.CLOTUREE })
      );
    });

    it('lève BadRequestError si pas OUVERTE', async () => {
      mockReunionRepo.findOne.mockResolvedValueOnce(
        makeMockReunion({ statut: StatutReunion.PLANIFIEE })
      );

      await expect(
        service.cloturer('reunion-uuid-1', { clotureeParExerciceMembreId: 'em-admin-1' })
      ).rejects.toThrow('BadRequestError');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // annuler()
  // ─────────────────────────────────────────────────────────────────────────

  describe('annuler()', () => {
    it('PLANIFIEE → ANNULEE', async () => {
      const planifiee = makeMockReunion({ statut: StatutReunion.PLANIFIEE });
      mockReunionRepo.findOne
        .mockResolvedValueOnce(planifiee)
        .mockResolvedValueOnce({ ...planifiee, statut: StatutReunion.ANNULEE, presences: [] });

      await service.annuler('reunion-uuid-1');

      expect(mockReunionRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ statut: StatutReunion.ANNULEE })
      );
    });

    it('lève BadRequestError si déjà CLOTUREE', async () => {
      mockReunionRepo.findOne.mockResolvedValueOnce(
        makeMockReunion({ statut: StatutReunion.CLOTUREE })
      );

      await expect(service.annuler('reunion-uuid-1')).rejects.toThrow('BadRequestError');
    });

    it('lève NotFoundError si reunion inexistante', async () => {
      mockReunionRepo.findOne.mockResolvedValueOnce(null);

      await expect(service.annuler('unknown-id')).rejects.toThrow('NotFoundError');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // findAll()
  // ─────────────────────────────────────────────────────────────────────────

  describe('findAll()', () => {
    it('filtre par exerciceId', async () => {
      const qb = mockReunionRepo.createQueryBuilder();
      qb.getMany.mockResolvedValue([]);

      await service.findAll({ exerciceId: 'exercice-uuid-1' });

      expect(qb.where).toHaveBeenCalledWith(
        expect.stringContaining('exerciceId'),
        expect.any(Object)
      );
    });

    it('retourne un tableau de DTOs', async () => {
      const qb = mockReunionRepo.createQueryBuilder();
      const reunion = makeMockReunion({ presences: [] });
      qb.getMany.mockResolvedValue([reunion]);

      const result = await service.findAll({});

      expect(Array.isArray(result)).toBe(true);
    });
  });
});
