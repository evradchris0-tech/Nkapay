/**
 * Tests unitaires pour TontineService
 */

import { createMockRepo } from '../../helpers/mock-repo';

const mockTontineRepo = createMockRepo();
const mockTontineTypeRepo = createMockRepo();

jest.mock('../../../src/config', () => ({
  AppDataSource: {
    getRepository: jest.fn((entity: any) => {
      const name = typeof entity === 'string' ? entity : entity?.name ?? String(entity);
      if (name === 'Tontine') return mockTontineRepo;
      if (name === 'TontineType') return mockTontineTypeRepo;
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

import { TontineService } from '../../../src/modules/tontines/services/tontine.service';
import { StatutTontine } from '../../../src/modules/tontines/entities/tontine.entity';

function makeMockTontine(overrides: any = {}) {
  return {
    id: 'tontine-uuid-1',
    nom: 'Tontine Test',
    nomCourt: 'TT',
    tontineTypeId: 'type-uuid-1',
    statut: StatutTontine.ACTIVE,
    anneeFondation: 2020,
    motto: null,
    logo: null,
    estOfficiellementDeclaree: false,
    numeroEnregistrement: null,
    documentStatuts: null,
    organisationId: null,
    tontineType: { id: 'type-uuid-1', code: 'CLASSIQUE', libelle: 'Classique' },
    adhesions: [],
    exercices: [],
    creeLe: new Date(),
    modifieLe: null,
    ...overrides,
  };
}

describe('TontineService', () => {
  let service: TontineService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new TontineService();
    mockTontineRepo.create.mockImplementation((data: any) => ({ ...data }));
    mockTontineRepo.save.mockImplementation((data: any) => Promise.resolve({ id: 'tontine-uuid-1', ...data }));
  });

  describe('create()', () => {
    it('crée avec statut ACTIVE', async () => {
      mockTontineTypeRepo.findOne.mockResolvedValue({ id: 'type-uuid-1' });
      mockTontineRepo.findOne
        .mockResolvedValueOnce(null) // nom court unique
        .mockResolvedValueOnce(makeMockTontine()); // reloaded

      const result = await service.create({ nom: 'Tontine Test', nomCourt: 'TT', tontineTypeId: 'type-uuid-1' });

      expect(mockTontineRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ statut: StatutTontine.ACTIVE })
      );
      expect(result).toHaveProperty('id');
    });

    it('lève NotFoundError si tontineType inexistant', async () => {
      mockTontineTypeRepo.findOne.mockResolvedValue(null);

      await expect(
        service.create({ nom: 'Test', nomCourt: 'T', tontineTypeId: 'unknown' })
      ).rejects.toThrow('NotFoundError');
    });

    it('lève BadRequestError si nomCourt dupliqué', async () => {
      mockTontineTypeRepo.findOne.mockResolvedValue({ id: 'type-uuid-1' });
      mockTontineRepo.findOne.mockResolvedValueOnce(makeMockTontine()); // exists

      await expect(
        service.create({ nom: 'Test', nomCourt: 'TT', tontineTypeId: 'type-uuid-1' })
      ).rejects.toThrow('BadRequestError');
    });

    it('assigne organisationId si fourni', async () => {
      mockTontineTypeRepo.findOne.mockResolvedValue({ id: 'type-uuid-1' });
      mockTontineRepo.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(makeMockTontine({ organisationId: 'org-uuid-1' }));

      await service.create({ nom: 'Test', nomCourt: 'T2', tontineTypeId: 'type-uuid-1' }, 'org-uuid-1');

      expect(mockTontineRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ organisationId: 'org-uuid-1' })
      );
    });
  });

  describe('findAll()', () => {
    it('filtre par statut', async () => {
      const qb = mockTontineRepo.createQueryBuilder();
      qb.getRawAndEntities.mockResolvedValue({ entities: [], raw: [] });

      await service.findAll({ statut: StatutTontine.ACTIVE });

      expect(qb.andWhere).toHaveBeenCalledWith(
        expect.stringContaining('statut'),
        expect.any(Object)
      );
    });

    it('filtre par organisationId', async () => {
      const qb = mockTontineRepo.createQueryBuilder();
      qb.getRawAndEntities.mockResolvedValue({ entities: [], raw: [] });

      await service.findAll({ organisationId: 'org-uuid-1' });

      expect(qb.andWhere).toHaveBeenCalledWith(
        expect.stringContaining('organisation_id'),
        expect.any(Object)
      );
    });
  });

  describe('suspend() / activate()', () => {
    it('suspend → SUSPENDUE', async () => {
      const tontine = makeMockTontine({ statut: StatutTontine.ACTIVE });
      mockTontineRepo.findOne
        .mockResolvedValueOnce(tontine)
        .mockResolvedValueOnce({ ...tontine, statut: StatutTontine.SUSPENDUE });

      await service.suspend('tontine-uuid-1');

      expect(mockTontineRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ statut: StatutTontine.SUSPENDUE })
      );
    });

    it('activate → ACTIVE', async () => {
      const tontine = makeMockTontine({ statut: StatutTontine.SUSPENDUE });
      mockTontineRepo.findOne
        .mockResolvedValueOnce(tontine)
        .mockResolvedValueOnce({ ...tontine, statut: StatutTontine.ACTIVE });

      await service.activate('tontine-uuid-1');

      expect(mockTontineRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ statut: StatutTontine.ACTIVE })
      );
    });
  });

  describe('update()', () => {
    it('lève BadRequestError si nomCourt dupliqué au changement', async () => {
      const tontine = makeMockTontine({ nomCourt: 'TT' });
      mockTontineRepo.findOne
        .mockResolvedValueOnce(tontine)
        .mockResolvedValueOnce(makeMockTontine({ id: 'autre-id', nomCourt: 'NEW' })); // existe déjà

      await expect(
        service.update('tontine-uuid-1', { nomCourt: 'NEW' })
      ).rejects.toThrow('BadRequestError');
    });
  });
});
