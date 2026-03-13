/**
 * Tests unitaires pour DistributionService
 */

import { createMockRepo } from '../../helpers/mock-repo';

const mockDistributionRepo = createMockRepo();
const mockExerciceMembreRepo = createMockRepo();
const mockReunionRepo = createMockRepo();

jest.mock('../../../src/config', () => ({
  AppDataSource: {
    getRepository: jest.fn((entity: any) => {
      const name = typeof entity === 'string' ? entity : entity?.name ?? String(entity);
      if (name === 'Distribution') return mockDistributionRepo;
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

import { DistributionService } from '../../../src/modules/distributions/services/distribution.service';
import { StatutDistribution } from '../../../src/modules/distributions/entities/distribution.entity';

function makeMockDistribution(overrides: any = {}) {
  return {
    id: 'dist-uuid-1',
    reunionId: 'reunion-uuid-1',
    exerciceMembreBeneficiaireId: 'em-uuid-1',
    ordre: 1,
    montantBrut: 120000,
    montantRetenu: 0,
    montantNet: 120000,
    statut: StatutDistribution.PLANIFIEE,
    commentaire: null,
    exerciceMembre: null,
    creeLe: new Date(),
    ...overrides,
  };
}

describe('DistributionService', () => {
  let service: DistributionService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new DistributionService();
    mockDistributionRepo.create.mockImplementation((data: any) => ({ ...data }));
    mockDistributionRepo.save.mockImplementation((data: any) =>
      Promise.resolve({ id: 'dist-uuid-1', ...data })
    );
  });

  describe('create()', () => {
    it('crée en statut PLANIFIEE', async () => {
      mockExerciceMembreRepo.findOne.mockResolvedValue({ id: 'em-uuid-1' });
      mockReunionRepo.findOne.mockResolvedValue({ id: 'reunion-uuid-1' });
      mockDistributionRepo.findOne
        .mockResolvedValueOnce(null)    // unicité ordre
        .mockResolvedValueOnce(makeMockDistribution()); // findById

      const result = await service.create({
        reunionId: 'reunion-uuid-1',
        exerciceMembreBeneficiaireId: 'em-uuid-1',
        ordre: 1,
        montantBrut: 120000,
      });

      expect(mockDistributionRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ statut: StatutDistribution.PLANIFIEE })
      );
      expect(result).toHaveProperty('id');
    });

    it('lève NotFoundError si bénéficiaire inexistant', async () => {
      mockExerciceMembreRepo.findOne.mockResolvedValue(null);

      await expect(
        service.create({ reunionId: 'r-1', exerciceMembreBeneficiaireId: 'unknown', ordre: 1, montantBrut: 10000 })
      ).rejects.toThrow('NotFoundError');
    });

    it('lève NotFoundError si réunion inexistante', async () => {
      mockExerciceMembreRepo.findOne.mockResolvedValue({ id: 'em-uuid-1' });
      mockReunionRepo.findOne.mockResolvedValue(null);

      await expect(
        service.create({ reunionId: 'unknown', exerciceMembreBeneficiaireId: 'em-uuid-1', ordre: 1, montantBrut: 10000 })
      ).rejects.toThrow('NotFoundError');
    });

    it('lève BadRequestError si ordre dupliqué pour la réunion', async () => {
      mockExerciceMembreRepo.findOne.mockResolvedValue({ id: 'em-uuid-1' });
      mockReunionRepo.findOne.mockResolvedValue({ id: 'reunion-uuid-1' });
      mockDistributionRepo.findOne.mockResolvedValueOnce(makeMockDistribution()); // ordre exists

      await expect(
        service.create({ reunionId: 'reunion-uuid-1', exerciceMembreBeneficiaireId: 'em-uuid-1', ordre: 1, montantBrut: 10000 })
      ).rejects.toThrow('BadRequestError');
    });
  });

  describe('findAll()', () => {
    it('retourne des résultats paginés', async () => {
      const qb = mockDistributionRepo.createQueryBuilder();
      qb.getManyAndCount.mockResolvedValue([[makeMockDistribution()], 1]);

      const result = await service.findAll({}, { page: 1, limit: 10 });

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('meta');
    });

    it('filtre par reunionId', async () => {
      const qb = mockDistributionRepo.createQueryBuilder();
      qb.getManyAndCount.mockResolvedValue([[], 0]);

      await service.findAll({ reunionId: 'reunion-uuid-1' });

      expect(qb.andWhere).toHaveBeenCalledWith(
        expect.stringContaining('reunionId'),
        expect.any(Object)
      );
    });
  });

  describe('findById()', () => {
    it('lève NotFoundError si distribution inexistante', async () => {
      mockDistributionRepo.findOne.mockResolvedValue(null);

      await expect(service.findById('unknown-id')).rejects.toThrow('NotFoundError');
    });
  });
});
