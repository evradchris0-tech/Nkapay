/**
 * Tests unitaires pour AdhesionTontineService
 */

import { createMockRepo } from '../../helpers/mock-repo';

const mockAdhesionRepo = createMockRepo();
const mockTontineRepo = createMockRepo();
const mockUtilisateurRepo = createMockRepo();

jest.mock('../../../src/config', () => ({
  AppDataSource: {
    getRepository: jest.fn((entity: any) => {
      const name = typeof entity === 'string' ? entity : entity?.name ?? String(entity);
      if (name === 'AdhesionTontine') return mockAdhesionRepo;
      if (name === 'Tontine') return mockTontineRepo;
      if (name === 'Utilisateur') return mockUtilisateurRepo;
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

import { AdhesionTontineService } from '../../../src/modules/tontines/services/adhesion-tontine.service';
import { StatutAdhesion } from '../../../src/modules/tontines/entities/adhesion-tontine.entity';

function makeMockAdhesion(overrides: any = {}) {
  return {
    id: 'adh-uuid-1',
    tontineId: 'tontine-uuid-1',
    utilisateurId: 'user-uuid-1',
    matricule: 'T001',
    role: 'MEMBRE',
    statut: StatutAdhesion.ACTIVE,
    dateAdhesionTontine: new Date(),
    tontine: { id: 'tontine-uuid-1', nom: 'Tontine Test', nomCourt: 'TT' },
    utilisateur: { id: 'user-uuid-1', nom: 'Dupont', prenom: 'Jean', telephone1: '690000001' },
    ...overrides,
  };
}

describe('AdhesionTontineService', () => {
  let service: AdhesionTontineService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AdhesionTontineService();
    mockAdhesionRepo.create.mockImplementation((data: any) => ({ ...data }));
    mockAdhesionRepo.save.mockImplementation((data: any) => Promise.resolve({ id: 'adh-uuid-1', ...data }));
  });

  describe('create()', () => {
    it('crée avec statut ACTIVE', async () => {
      mockTontineRepo.findOne.mockResolvedValue({ id: 'tontine-uuid-1' });
      mockUtilisateurRepo.findOne.mockResolvedValue({ id: 'user-uuid-1' });
      mockAdhesionRepo.findOne
        .mockResolvedValueOnce(null)  // pas déjà membre
        .mockResolvedValueOnce(null)  // matricule unique
        .mockResolvedValueOnce(makeMockAdhesion()); // reloaded

      const result = await service.create({
        tontineId: 'tontine-uuid-1',
        utilisateurId: 'user-uuid-1',
        matricule: 'T001',
      });

      expect(mockAdhesionRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ statut: StatutAdhesion.ACTIVE })
      );
      expect(result).toHaveProperty('id');
    });

    it('lève NotFoundError si tontine inexistante', async () => {
      mockTontineRepo.findOne.mockResolvedValue(null);

      await expect(
        service.create({ tontineId: 'unknown', utilisateurId: 'user-uuid-1', matricule: 'T001' })
      ).rejects.toThrow('NotFoundError');
    });

    it('lève NotFoundError si utilisateur inexistant', async () => {
      mockTontineRepo.findOne.mockResolvedValue({ id: 'tontine-uuid-1' });
      mockUtilisateurRepo.findOne.mockResolvedValue(null);

      await expect(
        service.create({ tontineId: 'tontine-uuid-1', utilisateurId: 'unknown', matricule: 'T001' })
      ).rejects.toThrow('NotFoundError');
    });

    it('lève BadRequestError si déjà membre', async () => {
      mockTontineRepo.findOne.mockResolvedValue({ id: 'tontine-uuid-1' });
      mockUtilisateurRepo.findOne.mockResolvedValue({ id: 'user-uuid-1' });
      mockAdhesionRepo.findOne.mockResolvedValueOnce(makeMockAdhesion()); // déjà membre

      await expect(
        service.create({ tontineId: 'tontine-uuid-1', utilisateurId: 'user-uuid-1', matricule: 'T001' })
      ).rejects.toThrow('BadRequestError');
    });

    it('lève BadRequestError si matricule dupliqué', async () => {
      mockTontineRepo.findOne.mockResolvedValue({ id: 'tontine-uuid-1' });
      mockUtilisateurRepo.findOne.mockResolvedValue({ id: 'user-uuid-1' });
      mockAdhesionRepo.findOne
        .mockResolvedValueOnce(null)              // pas déjà membre
        .mockResolvedValueOnce(makeMockAdhesion()); // matricule existe déjà

      await expect(
        service.create({ tontineId: 'tontine-uuid-1', utilisateurId: 'user-uuid-1', matricule: 'T001' })
      ).rejects.toThrow('BadRequestError');
    });
  });

  describe('deactivate() / reactivate()', () => {
    it('ACTIVE → INACTIVE via deactivate()', async () => {
      const adh = makeMockAdhesion({ statut: StatutAdhesion.ACTIVE });
      mockAdhesionRepo.findOne
        .mockResolvedValueOnce(adh)
        .mockResolvedValueOnce({ ...adh, statut: StatutAdhesion.INACTIVE });

      await service.deactivate('adh-uuid-1');

      expect(mockAdhesionRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ statut: StatutAdhesion.INACTIVE })
      );
    });

    it('INACTIVE → ACTIVE via reactivate()', async () => {
      const adh = makeMockAdhesion({ statut: StatutAdhesion.INACTIVE });
      mockAdhesionRepo.findOne
        .mockResolvedValueOnce(adh)
        .mockResolvedValueOnce({ ...adh, statut: StatutAdhesion.ACTIVE });

      await service.reactivate('adh-uuid-1');

      expect(mockAdhesionRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ statut: StatutAdhesion.ACTIVE })
      );
    });
  });

  describe('findByTontine()', () => {
    it('retourne la liste filtrée par tontine', async () => {
      const qb = mockAdhesionRepo.createQueryBuilder();
      qb.getMany.mockResolvedValue([makeMockAdhesion()]);

      const result = await service.findByTontine('tontine-uuid-1');

      expect(qb.where).toHaveBeenCalledWith(
        expect.stringContaining('tontineId'),
        expect.any(Object)
      );
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('findByUser()', () => {
    it('retourne les adhésions d\'un membre', async () => {
      mockAdhesionRepo.find.mockResolvedValue([makeMockAdhesion()]);

      const result = await service.findByUser('user-uuid-1');

      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(1);
    });
  });
});
