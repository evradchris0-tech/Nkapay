/**
 * Tests unitaires pour EvenementSecoursService
 */

import { createMockRepo } from '../../helpers/mock-repo';

// ─── Mocks modules ────────────────────────────────────────────────────────────

const mockEvenementRepo = createMockRepo();
const mockTypeRepo = createMockRepo();
const mockMembreRepo = createMockRepo();
const mockTransactionRepo = createMockRepo();
const mockBilanRepo = createMockRepo();
const mockExerciceRepo = createMockRepo();
const mockPieceRepo = createMockRepo();

const mockQueryRunner = {
  connect: jest.fn(),
  startTransaction: jest.fn(),
  commitTransaction: jest.fn(),
  rollbackTransaction: jest.fn(),
  release: jest.fn(),
  manager: {
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn((_entity: any, data: any) => ({ ...data })),
  },
};

jest.mock('../../../src/config', () => ({
  AppDataSource: {
    getRepository: jest.fn((entity: any) => {
      const name = typeof entity === 'string' ? entity : entity?.name ?? String(entity);
      if (name === 'EvenementSecours') return mockEvenementRepo;
      if (name === 'TypeEvenementSecours') return mockTypeRepo;
      if (name === 'ExerciceMembre') return mockMembreRepo;
      if (name === 'Transaction') return mockTransactionRepo;
      if (name === 'BilanSecoursExercice') return mockBilanRepo;
      if (name === 'Exercice') return mockExerciceRepo;
      if (name === 'PieceJustificativeSecours') return mockPieceRepo;
      return createMockRepo();
    }),
    createQueryRunner: jest.fn(() => mockQueryRunner),
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

// ─── Import sous test ─────────────────────────────────────────────────────────

import { EvenementSecoursService } from '../../../src/modules/secours/services/evenement-secours.service';
import { StatutEvenementSecours } from '../../../src/modules/secours/entities/evenement-secours.entity';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeMockEvenement(overrides: any = {}) {
  return {
    id: 'evt-uuid-1',
    exerciceMembreId: 'em-uuid-1',
    typeEvenementSecoursId: 'type-uuid-1',
    dateEvenement: new Date('2024-01-01'),
    description: 'Décès du père',
    montantDemande: 100000,
    montantApprouve: null,
    montantDecaisse: null,
    statut: StatutEvenementSecours.DECLARE,
    dateDeclaration: new Date(),
    dateValidation: null,
    dateDecaissement: null,
    valideParExerciceMembreId: null,
    transactionId: null,
    reunionId: null,
    motifRefus: null,
    exerciceMembre: null,
    typeEvenementSecours: null,
    piecesJustificatives: [],
    ...overrides,
  };
}

function makeMockType(overrides: any = {}) {
  return {
    id: 'type-uuid-1',
    code: 'DECES',
    libelle: 'Décès',
    montantParDefaut: 100000,
    estActif: true,
    ...overrides,
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('EvenementSecoursService', () => {
  let service: EvenementSecoursService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new EvenementSecoursService();

    mockEvenementRepo.create.mockImplementation((data: any) => ({ ...data }));
    mockEvenementRepo.save.mockImplementation((data: any) =>
      Promise.resolve({ id: 'evt-uuid-1', ...data })
    );
  });

  // ─────────────────────────────────────────────────────────────────────────
  // create()
  // ─────────────────────────────────────────────────────────────────────────

  describe('create()', () => {
    it('crée en statut DECLARE', async () => {
      mockMembreRepo.findOne.mockResolvedValue({ id: 'em-uuid-1' });
      mockTypeRepo.findOne.mockResolvedValue(makeMockType());
      mockEvenementRepo.findOne.mockResolvedValue(makeMockEvenement());

      const dto = {
        exerciceMembreId: 'em-uuid-1',
        typeEvenementSecoursId: 'type-uuid-1',
        dateEvenement: '2024-01-01',
      };

      const result = await service.create(dto);

      expect(mockEvenementRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ statut: StatutEvenementSecours.DECLARE })
      );
      expect(result).toHaveProperty('id');
    });

    it('lève NotFoundError si ExerciceMembre inexistant', async () => {
      mockMembreRepo.findOne.mockResolvedValue(null);

      await expect(
        service.create({ exerciceMembreId: 'em-unknown', typeEvenementSecoursId: 't-1', dateEvenement: '2024-01-01' })
      ).rejects.toThrow('NotFoundError');
    });

    it('lève NotFoundError si TypeEvenementSecours inexistant', async () => {
      mockMembreRepo.findOne.mockResolvedValue({ id: 'em-uuid-1' });
      mockTypeRepo.findOne.mockResolvedValue(null);

      await expect(
        service.create({ exerciceMembreId: 'em-uuid-1', typeEvenementSecoursId: 't-unknown', dateEvenement: '2024-01-01' })
      ).rejects.toThrow('NotFoundError');
    });

    it('lève BadRequestError si type désactivé', async () => {
      mockMembreRepo.findOne.mockResolvedValue({ id: 'em-uuid-1' });
      mockTypeRepo.findOne.mockResolvedValue(makeMockType({ estActif: false }));

      await expect(
        service.create({ exerciceMembreId: 'em-uuid-1', typeEvenementSecoursId: 'type-uuid-1', dateEvenement: '2024-01-01' })
      ).rejects.toThrow('BadRequestError');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // soumettre()
  // ─────────────────────────────────────────────────────────────────────────

  describe('soumettre()', () => {
    it('DECLARE → EN_COURS_VALIDATION', async () => {
      const evt = makeMockEvenement({ statut: StatutEvenementSecours.DECLARE });
      mockEvenementRepo.findOne
        .mockResolvedValueOnce(evt)
        .mockResolvedValueOnce({ ...evt, statut: StatutEvenementSecours.EN_COURS_VALIDATION });

      await service.soumettre('evt-uuid-1');

      expect(mockEvenementRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ statut: StatutEvenementSecours.EN_COURS_VALIDATION })
      );
    });

    it('lève BadRequestError si pas en DECLARE', async () => {
      mockEvenementRepo.findOne.mockResolvedValueOnce(
        makeMockEvenement({ statut: StatutEvenementSecours.VALIDE })
      );

      await expect(service.soumettre('evt-uuid-1')).rejects.toThrow('BadRequestError');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // valider()
  // ─────────────────────────────────────────────────────────────────────────

  describe('valider()', () => {
    it('EN_COURS_VALIDATION → VALIDE', async () => {
      const evt = makeMockEvenement({ statut: StatutEvenementSecours.EN_COURS_VALIDATION });
      mockEvenementRepo.findOne
        .mockResolvedValueOnce(evt)
        .mockResolvedValueOnce({ ...evt, statut: StatutEvenementSecours.VALIDE });

      await service.valider('evt-uuid-1', { valideParExerciceMembreId: 'em-admin-1', montantApprouve: 100000 });

      expect(mockEvenementRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ statut: StatutEvenementSecours.VALIDE })
      );
    });

    it('lève BadRequestError si état invalide (déjà PAYE)', async () => {
      mockEvenementRepo.findOne.mockResolvedValueOnce(
        makeMockEvenement({ statut: StatutEvenementSecours.PAYE })
      );

      await expect(
        service.valider('evt-uuid-1', { valideParExerciceMembreId: 'em-admin-1', montantApprouve: 100000 })
      ).rejects.toThrow('BadRequestError');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // refuser()
  // ─────────────────────────────────────────────────────────────────────────

  describe('refuser()', () => {
    it('DECLARE → REFUSE avec motif', async () => {
      const evt = makeMockEvenement({ statut: StatutEvenementSecours.DECLARE });
      mockEvenementRepo.findOne
        .mockResolvedValueOnce(evt)
        .mockResolvedValueOnce({ ...evt, statut: StatutEvenementSecours.REFUSE });

      await service.refuser('evt-uuid-1', { refuseParExerciceMembreId: 'em-admin-1', motifRefus: 'Justificatifs insuffisants' });

      expect(mockEvenementRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ statut: StatutEvenementSecours.REFUSE })
      );
    });

    it('lève NotFoundError si événement inexistant', async () => {
      mockEvenementRepo.findOne.mockResolvedValueOnce(null);

      await expect(
        service.refuser('unknown-id', { refuseParExerciceMembreId: 'em-admin-1', motifRefus: 'Raison' })
      ).rejects.toThrow('NotFoundError');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // payer()
  // ─────────────────────────────────────────────────────────────────────────

  describe('payer()', () => {
    it('VALIDE → PAYE', async () => {
      const evt = makeMockEvenement({ statut: StatutEvenementSecours.VALIDE, montantApprouve: 100000 });
      mockEvenementRepo.findOne
        .mockResolvedValueOnce(evt)
        .mockResolvedValueOnce({ ...evt, statut: StatutEvenementSecours.PAYE });

      await service.payer('evt-uuid-1', { transactionId: 'txn-uuid-1' });

      expect(mockEvenementRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ statut: StatutEvenementSecours.PAYE })
      );
    });

    it('lève BadRequestError si pas VALIDE', async () => {
      mockEvenementRepo.findOne.mockResolvedValueOnce(
        makeMockEvenement({ statut: StatutEvenementSecours.DECLARE })
      );

      await expect(
        service.payer('evt-uuid-1', { transactionId: 'txn-uuid-1' })
      ).rejects.toThrow('BadRequestError');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // findAll()
  // ─────────────────────────────────────────────────────────────────────────

  describe('findAll()', () => {
    it('retourne des résultats paginés', async () => {
      const qb = mockEvenementRepo.createQueryBuilder();
      qb.getManyAndCount.mockResolvedValue([[makeMockEvenement()], 1]);

      const result = await service.findAll({}, { page: 1, limit: 10 });

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('meta');
    });

    it('filtre par exerciceId', async () => {
      const qb = mockEvenementRepo.createQueryBuilder();
      qb.getManyAndCount.mockResolvedValue([[], 0]);

      await service.findAll({ exerciceId: 'exo-uuid-1' });

      expect(qb.andWhere).toHaveBeenCalledWith(
        expect.stringContaining('exerciceId'),
        expect.any(Object)
      );
    });

    it('filtre par statut', async () => {
      const qb = mockEvenementRepo.createQueryBuilder();
      qb.getManyAndCount.mockResolvedValue([[], 0]);

      await service.findAll({ statut: StatutEvenementSecours.VALIDE });

      expect(qb.andWhere).toHaveBeenCalledWith(
        expect.stringContaining('statut'),
        expect.any(Object)
      );
    });
  });
});
