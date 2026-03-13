/**
 * Tests unitaires pour ExerciceService
 */

import { createMockRepo } from '../../helpers/mock-repo';

// ─── Mocks modules ────────────────────────────────────────────────────────────

const mockExerciceRepo = createMockRepo();
const mockExerciceMembreRepo = createMockRepo();
const mockTontineRepo = createMockRepo();
const mockAdhesionRepo = createMockRepo();

jest.mock('../../../src/config', () => ({
  AppDataSource: {
    getRepository: jest.fn((entity: any) => {
      const name = typeof entity === 'string' ? entity : entity?.name ?? String(entity);
      if (name === 'Exercice') return mockExerciceRepo;
      if (name === 'ExerciceMembre') return mockExerciceMembreRepo;
      if (name === 'Tontine') return mockTontineRepo;
      if (name === 'AdhesionTontine') return mockAdhesionRepo;
      return createMockRepo();
    }),
    createQueryRunner: jest.fn(),
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
  regleExerciceService: { initializeFromTontine: jest.fn().mockResolvedValue(undefined) },
}));

// ─── Import sous test ─────────────────────────────────────────────────────────

import { ExerciceService } from '../../../src/modules/exercices/services/exercice.service';
import { StatutExercice } from '../../../src/modules/exercices/entities/exercice.entity';
import { StatutAdhesion } from '../../../src/modules/tontines/entities/adhesion-tontine.entity';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeMockExercice(overrides: any = {}) {
  return {
    id: 'exercice-uuid-1',
    tontineId: 'tontine-uuid-1',
    libelle: 'Exercice 2024',
    anneeDebut: 2024,
    moisDebut: 1,
    anneeFin: 2024,
    moisFin: 12,
    dureeMois: 12,
    statut: StatutExercice.BROUILLON,
    tontine: { id: 'tontine-uuid-1', nom: 'Tontine Test', nomCourt: 'TT' },
    membres: [],
    reunions: [],
    creeLe: new Date(),
    modifieLe: null,
    ouvertLe: null,
    fermeLe: null,
    ...overrides,
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('ExerciceService', () => {
  let service: ExerciceService;

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset lazy repos
    service = new ExerciceService();

    mockExerciceRepo.create.mockImplementation((data: any) => ({ ...data }));
    mockExerciceRepo.save.mockImplementation((data: any) =>
      Promise.resolve({ id: 'exercice-uuid-1', ...data })
    );
  });

  // ─────────────────────────────────────────────────────────────────────────
  // create()
  // ─────────────────────────────────────────────────────────────────────────

  describe('create()', () => {
    it('crée en statut BROUILLON', async () => {
      mockTontineRepo.findOne.mockResolvedValue({ id: 'tontine-uuid-1', nom: 'Tontine Test' });
      mockExerciceRepo.findOne
        .mockResolvedValueOnce(null) // unicité libelle
        .mockResolvedValueOnce(makeMockExercice()); // reloaded after save

      const dto = {
        tontineId: 'tontine-uuid-1',
        libelle: 'Exercice 2024',
        anneeDebut: 2024,
        moisDebut: 1,
        anneeFin: 2024,
        moisFin: 12,
        dureeMois: 12,
      };

      const result = await service.create(dto);

      expect(mockExerciceRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ statut: StatutExercice.BROUILLON })
      );
      expect(result).toHaveProperty('id');
    });

    it('lève NotFoundError si tontine inexistante', async () => {
      mockTontineRepo.findOne.mockResolvedValue(null);

      await expect(
        service.create({
          tontineId: 'tontine-unknown',
          libelle: 'Test',
          anneeDebut: 2024,
          moisDebut: 1,
          anneeFin: 2024,
          moisFin: 12,
          dureeMois: 12,
        })
      ).rejects.toThrow('NotFoundError');
    });

    it('lève BadRequestError si libelle dupliqué dans la même tontine', async () => {
      mockTontineRepo.findOne.mockResolvedValue({ id: 'tontine-uuid-1' });
      mockExerciceRepo.findOne.mockResolvedValueOnce(makeMockExercice()); // libelle exists

      await expect(
        service.create({
          tontineId: 'tontine-uuid-1',
          libelle: 'Exercice 2024',
          anneeDebut: 2024,
          moisDebut: 1,
          anneeFin: 2024,
          moisFin: 12,
          dureeMois: 12,
        })
      ).rejects.toThrow('BadRequestError');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // ouvrir()
  // ─────────────────────────────────────────────────────────────────────────

  describe('ouvrir()', () => {
    it('passe BROUILLON → OUVERT', async () => {
      const brouillon = makeMockExercice({ statut: StatutExercice.BROUILLON });
      mockExerciceRepo.findOne
        .mockResolvedValueOnce(brouillon) // in ouvrir()
        .mockResolvedValueOnce(null)       // no exercice ouvert
        .mockResolvedValueOnce({ ...brouillon, statut: StatutExercice.OUVERT }); // reloaded
      mockAdhesionRepo.find.mockResolvedValue([]);

      await service.ouvrir('exercice-uuid-1');

      expect(mockExerciceRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ statut: StatutExercice.OUVERT })
      );
    });

    it('ajoute automatiquement les membres actifs', async () => {
      const brouillon = makeMockExercice({ statut: StatutExercice.BROUILLON });
      mockExerciceRepo.findOne
        .mockResolvedValueOnce(brouillon)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ ...brouillon, statut: StatutExercice.OUVERT, membres: [] });

      const adhesions = [
        { id: 'adh-1', tontineId: 'tontine-uuid-1', statut: StatutAdhesion.ACTIVE },
        { id: 'adh-2', tontineId: 'tontine-uuid-1', statut: StatutAdhesion.ACTIVE },
      ];
      mockAdhesionRepo.find.mockResolvedValue(adhesions);
      mockExerciceMembreRepo.create.mockImplementation((data: any) => ({ ...data }));
      mockExerciceMembreRepo.save.mockResolvedValue([]);

      await service.ouvrir('exercice-uuid-1');

      expect(mockExerciceMembreRepo.save).toHaveBeenCalled();
    });

    it('lève BadRequestError si un autre exercice est déjà OUVERT', async () => {
      const brouillon = makeMockExercice({ statut: StatutExercice.BROUILLON });
      mockExerciceRepo.findOne
        .mockResolvedValueOnce(brouillon)
        .mockResolvedValueOnce(makeMockExercice({ id: 'autre-exercice', statut: StatutExercice.OUVERT }));

      await expect(service.ouvrir('exercice-uuid-1')).rejects.toThrow('BadRequestError');
    });

    it('lève BadRequestError si déjà OUVERT', async () => {
      const ouvert = makeMockExercice({ statut: StatutExercice.OUVERT });
      mockExerciceRepo.findOne.mockResolvedValueOnce(ouvert);

      await expect(service.ouvrir('exercice-uuid-1')).rejects.toThrow('BadRequestError');
    });

    it('lève NotFoundError si exercice inexistant', async () => {
      mockExerciceRepo.findOne.mockResolvedValueOnce(null);

      await expect(service.ouvrir('unknown-id')).rejects.toThrow('NotFoundError');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // suspendre() / reprendre()
  // ─────────────────────────────────────────────────────────────────────────

  describe('suspendre()', () => {
    it('OUVERT → SUSPENDU', async () => {
      const ouvert = makeMockExercice({ statut: StatutExercice.OUVERT });
      mockExerciceRepo.findOne.mockResolvedValue(ouvert);

      await service.suspendre('exercice-uuid-1');

      expect(mockExerciceRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ statut: StatutExercice.SUSPENDU })
      );
    });

    it('lève BadRequestError si pas OUVERT', async () => {
      const brouillon = makeMockExercice({ statut: StatutExercice.BROUILLON });
      mockExerciceRepo.findOne.mockResolvedValue(brouillon);

      await expect(service.suspendre('exercice-uuid-1')).rejects.toThrow('BadRequestError');
    });
  });

  describe('reprendre()', () => {
    it('SUSPENDU → OUVERT', async () => {
      const suspendu = makeMockExercice({ statut: StatutExercice.SUSPENDU });
      mockExerciceRepo.findOne.mockResolvedValue(suspendu);

      await service.reprendre('exercice-uuid-1');

      expect(mockExerciceRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ statut: StatutExercice.OUVERT })
      );
    });

    it('lève BadRequestError si pas SUSPENDU', async () => {
      const ouvert = makeMockExercice({ statut: StatutExercice.OUVERT });
      mockExerciceRepo.findOne.mockResolvedValue(ouvert);

      await expect(service.reprendre('exercice-uuid-1')).rejects.toThrow('BadRequestError');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // fermer()
  // ─────────────────────────────────────────────────────────────────────────

  describe('fermer()', () => {
    it('OUVERT → FERME', async () => {
      const ouvert = makeMockExercice({ statut: StatutExercice.OUVERT });
      mockExerciceRepo.findOne.mockResolvedValue(ouvert);

      await service.fermer('exercice-uuid-1');

      expect(mockExerciceRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ statut: StatutExercice.FERME })
      );
    });

    it('lève BadRequestError si pas OUVERT', async () => {
      const brouillon = makeMockExercice({ statut: StatutExercice.BROUILLON });
      mockExerciceRepo.findOne.mockResolvedValue(brouillon);

      await expect(service.fermer('exercice-uuid-1')).rejects.toThrow('BadRequestError');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // findAll()
  // ─────────────────────────────────────────────────────────────────────────

  describe('findAll()', () => {
    it('filtre par tontineId', async () => {
      const qb = mockExerciceRepo.createQueryBuilder();
      qb.getRawAndEntities.mockResolvedValue({ entities: [], raw: [] });

      await service.findAll({ tontineId: 'tontine-uuid-1' });

      expect(qb.where).toHaveBeenCalledWith(
        expect.stringContaining('tontineId'),
        expect.any(Object)
      );
    });

    it('filtre par statut', async () => {
      const qb = mockExerciceRepo.createQueryBuilder();
      qb.getRawAndEntities.mockResolvedValue({ entities: [], raw: [] });

      await service.findAll({ statut: StatutExercice.OUVERT });

      expect(qb.andWhere).toHaveBeenCalledWith(
        expect.stringContaining('statut'),
        expect.any(Object)
      );
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // findExerciceOuvert()
  // ─────────────────────────────────────────────────────────────────────────

  describe('findExerciceOuvert()', () => {
    it('retourne null si aucun exercice ouvert', async () => {
      mockExerciceRepo.findOne.mockResolvedValue(null);

      const result = await service.findExerciceOuvert('tontine-uuid-1');

      expect(result).toBeNull();
    });

    it('retourne le DTO si exercice ouvert trouvé', async () => {
      mockExerciceRepo.findOne.mockResolvedValue(
        makeMockExercice({ statut: StatutExercice.OUVERT })
      );

      const result = await service.findExerciceOuvert('tontine-uuid-1');

      expect(result).not.toBeNull();
      expect(result?.statut).toBe(StatutExercice.OUVERT);
    });
  });
});
