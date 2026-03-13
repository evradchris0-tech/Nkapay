/**
 * Tests unitaires pour PenaliteService
 */

import { createMockRepo } from '../../helpers/mock-repo';

const mockPenaliteRepo = createMockRepo();
const mockTypePenaliteRepo = createMockRepo();
const mockExerciceMembreRepo = createMockRepo();

jest.mock('../../../src/config', () => ({
  AppDataSource: {
    getRepository: jest.fn((entity: any) => {
      const name = typeof entity === 'string' ? entity : entity?.name ?? String(entity);
      if (name === 'Penalite') return mockPenaliteRepo;
      if (name === 'TypePenalite') return mockTypePenaliteRepo;
      if (name === 'ExerciceMembre') return mockExerciceMembreRepo;
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

jest.mock('../../../src/modules/exercices/services/regle-exercice.service', () => ({
  regleExerciceService: { getEffectiveValueByCle: jest.fn().mockResolvedValue(null) },
}));

import { PenaliteService } from '../../../src/modules/penalites/services/penalite.service';
import { StatutPenalite } from '../../../src/modules/penalites/entities/penalite.entity';

function makeMockPenalite(overrides: any = {}) {
  return {
    id: 'pen-uuid-1',
    exerciceMembreId: 'em-uuid-1',
    reunionId: 'reunion-uuid-1',
    typePenaliteId: 'type-uuid-1',
    montant: 2000,
    motif: null,
    statut: StatutPenalite.EN_ATTENTE,
    transactionId: null,
    exerciceMembre: null,
    typePenalite: { id: 'type-uuid-1', code: 'ABSENCE', libelle: 'Absence', valeurDefaut: 2000 },
    creeLe: new Date(),
    ...overrides,
  };
}

describe('PenaliteService', () => {
  let service: PenaliteService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new PenaliteService();
    mockPenaliteRepo.create.mockImplementation((data: any) => ({ ...data }));
    mockPenaliteRepo.save.mockImplementation((data: any) =>
      Promise.resolve({ id: 'pen-uuid-1', ...data })
    );
  });

  describe('create()', () => {
    it('crée en statut EN_ATTENTE', async () => {
      mockExerciceMembreRepo.findOne.mockResolvedValue({ id: 'em-uuid-1', exerciceId: 'exo-1' });
      mockTypePenaliteRepo.findOne.mockResolvedValue({ id: 'type-uuid-1', code: 'ABSENCE', valeurDefaut: 2000 });
      mockPenaliteRepo.findOne.mockResolvedValue(makeMockPenalite());

      const result = await service.create({
        exerciceMembreId: 'em-uuid-1',
        typePenaliteId: 'type-uuid-1',
        montant: 2000,
      });

      expect(mockPenaliteRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ statut: StatutPenalite.EN_ATTENTE })
      );
      expect(result).toHaveProperty('id');
    });

    it('lève NotFoundError si ExerciceMembre inexistant', async () => {
      mockExerciceMembreRepo.findOne.mockResolvedValue(null);

      await expect(
        service.create({ exerciceMembreId: 'em-unknown', typePenaliteId: 'type-uuid-1', montant: 1000 })
      ).rejects.toThrow('NotFoundError');
    });

    it('lève NotFoundError si TypePenalite inexistant', async () => {
      mockExerciceMembreRepo.findOne.mockResolvedValue({ id: 'em-uuid-1', exerciceId: 'exo-1' });
      mockTypePenaliteRepo.findOne.mockResolvedValue(null);

      await expect(
        service.create({ exerciceMembreId: 'em-uuid-1', typePenaliteId: 'type-unknown', montant: 1000 })
      ).rejects.toThrow('NotFoundError');
    });

    it('utilise le montant par défaut du TypePenalite si pas de règle', async () => {
      mockExerciceMembreRepo.findOne.mockResolvedValue({ id: 'em-uuid-1', exerciceId: 'exo-1' });
      mockTypePenaliteRepo.findOne.mockResolvedValue({ id: 'type-uuid-1', code: 'ABSENCE', valeurDefaut: 2000 });
      mockPenaliteRepo.findOne.mockResolvedValue(makeMockPenalite({ montant: 2000 }));

      const result = await service.create({ exerciceMembreId: 'em-uuid-1', typePenaliteId: 'type-uuid-1' , montant: 1000 });

      expect(result.montant).toBe(2000);
    });
  });

  describe('payer()', () => {
    it('EN_ATTENTE → PAYEE', async () => {
      const penalite = makeMockPenalite({ statut: StatutPenalite.EN_ATTENTE });
      mockPenaliteRepo.findOne
        .mockResolvedValueOnce(penalite)
        .mockResolvedValueOnce({ ...penalite, statut: StatutPenalite.PAYEE });

      await service.payer('pen-uuid-1', { transactionId: 'txn-uuid-1' });

      expect(mockPenaliteRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ statut: StatutPenalite.PAYEE })
      );
    });

    it('lève BadRequestError si pas EN_ATTENTE', async () => {
      mockPenaliteRepo.findOne.mockResolvedValueOnce(
        makeMockPenalite({ statut: StatutPenalite.PAYEE })
      );

      await expect(service.payer('pen-uuid-1', { transactionId: 'txn-1' })).rejects.toThrow('BadRequestError');
    });
  });

  describe('annuler()', () => {
    it('EN_ATTENTE → ANNULEE avec motif', async () => {
      const penalite = makeMockPenalite({ statut: StatutPenalite.EN_ATTENTE });
      mockPenaliteRepo.findOne
        .mockResolvedValueOnce(penalite)
        .mockResolvedValueOnce({ ...penalite, statut: StatutPenalite.ANNULEE });

      await service.annuler('pen-uuid-1', { motifAnnulation: 'Erreur de saisie' });

      expect(mockPenaliteRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ statut: StatutPenalite.ANNULEE })
      );
    });
  });

  describe('findAll()', () => {
    it('retourne des résultats paginés', async () => {
      const qb = mockPenaliteRepo.createQueryBuilder();
      qb.getManyAndCount.mockResolvedValue([[makeMockPenalite()], 1]);

      const result = await service.findAll({}, { page: 1, limit: 10 });

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('meta');
    });
  });
});
