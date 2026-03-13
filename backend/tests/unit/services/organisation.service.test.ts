/**
 * Tests unitaires pour OrganisationService
 */

import { createMockRepo } from '../../helpers/mock-repo';

const mockOrgRepo = createMockRepo();
const mockPlanRepo = createMockRepo();
const mockMembreRepo = createMockRepo();

jest.mock('../../../src/config', () => ({
  AppDataSource: {
    getRepository: jest.fn((entity: any) => {
      const name = typeof entity === 'string' ? entity : entity?.name ?? String(entity);
      if (name === 'Organisation') return mockOrgRepo;
      if (name === 'PlanAbonnement') return mockPlanRepo;
      if (name === 'MembreOrganisation') return mockMembreRepo;
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
  ConflictError: class ConflictError extends Error {
    statusCode = 409;
    constructor(message: string) { super(`ConflictError: ${message}`); this.name = 'ConflictError'; }
  },
}));

import { OrganisationService } from '../../../src/modules/organisations/services/organisation.service';
import { StatutOrganisation } from '../../../src/modules/organisations/entities/organisation.entity';
import { RoleOrganisation } from '../../../src/modules/organisations/entities/membre-organisation.entity';

function makeMockOrg(overrides: any = {}) {
  return {
    id: 'org-uuid-1',
    nom: 'Tontine Solidarité',
    slug: 'tontine-solidarite',
    emailContact: 'contact@tontine.cm',
    telephoneContact: null,
    pays: 'CM',
    devise: 'XAF',
    fuseauHoraire: 'Africa/Douala',
    logo: null,
    statut: StatutOrganisation.ACTIVE,
    planAbonnementId: 'plan-uuid-free',
    planAbonnement: { id: 'plan-uuid-free', code: 'FREE', libelle: 'Gratuit' },
    abonnementDebutLe: new Date(),
    abonnementFinLe: null,
    creeLe: new Date(),
    modifieLe: new Date(),
    ...overrides,
  };
}

function makeMockPlan(overrides: any = {}) {
  return {
    id: 'plan-uuid-free',
    code: 'FREE',
    libelle: 'Gratuit',
    maxTontines: 1,
    maxMembreParTontine: 20,
    maxExercicesParTontine: 1,
    ...overrides,
  };
}

describe('OrganisationService', () => {
  let service: OrganisationService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new OrganisationService();
    mockOrgRepo.create.mockImplementation((data: any) => ({ ...data }));
    mockOrgRepo.save.mockImplementation((data: any) =>
      Promise.resolve({ id: 'org-uuid-1', ...data })
    );
    mockMembreRepo.create.mockImplementation((data: any) => ({ ...data }));
    mockMembreRepo.save.mockImplementation((data: any) =>
      Promise.resolve({ id: 'membre-uuid-1', ...data })
    );
  });

  describe('create()', () => {
    it('crée avec plan FREE par défaut', async () => {
      mockOrgRepo.findOne
        .mockResolvedValueOnce(null)  // slug unique
        .mockResolvedValueOnce(null); // email unique
      mockPlanRepo.findOne.mockResolvedValue(makeMockPlan());
      mockOrgRepo.save.mockResolvedValue(makeMockOrg());

      const result = await service.create({
        nom: 'Tontine Solidarité',
        slug: 'tontine-solidarite',
        emailContact: 'contact@tontine.cm',
      });

      expect(mockOrgRepo.create).toHaveBeenCalled();
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('slug', 'tontine-solidarite');
    });

    it('lève ConflictError si slug déjà utilisé', async () => {
      mockOrgRepo.findOne.mockResolvedValueOnce(makeMockOrg()); // slug exists

      await expect(
        service.create({ nom: 'Test', slug: 'tontine-solidarite', emailContact: 'x@x.cm' })
      ).rejects.toThrow('ConflictError');
    });

    it('lève ConflictError si email déjà utilisé', async () => {
      mockOrgRepo.findOne
        .mockResolvedValueOnce(null)          // slug ok
        .mockResolvedValueOnce(makeMockOrg()); // email exists

      await expect(
        service.create({ nom: 'Test', slug: 'new-slug', emailContact: 'contact@tontine.cm' })
      ).rejects.toThrow('ConflictError');
    });

    it('lève NotFoundError si planAbonnementId fourni mais inexistant', async () => {
      mockOrgRepo.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);
      mockPlanRepo.findOne.mockResolvedValue(null); // plan not found

      await expect(
        service.create({
          nom: 'Test',
          slug: 'new-slug',
          emailContact: 'new@x.cm',
          planAbonnementId: 'unknown-plan',
        })
      ).rejects.toThrow('NotFoundError');
    });
  });

  describe('findById()', () => {
    it('retourne l\'organisation avec plan', async () => {
      mockOrgRepo.findOne.mockResolvedValue(makeMockOrg());

      const result = await service.findById('org-uuid-1');

      expect(result).toHaveProperty('id', 'org-uuid-1');
      expect(result).toHaveProperty('slug');
    });

    it('lève NotFoundError si inexistante', async () => {
      mockOrgRepo.findOne.mockResolvedValue(null);

      await expect(service.findById('unknown-id')).rejects.toThrow('NotFoundError');
    });
  });

  describe('update()', () => {
    it('modifie les champs fournis', async () => {
      const org = makeMockOrg();
      mockOrgRepo.findOne
        .mockResolvedValueOnce(org)   // findById for update
        .mockResolvedValueOnce(null); // email uniqueness check
      mockOrgRepo.save.mockResolvedValue({ ...org, nom: 'Nouveau Nom' });

      const result = await service.update('org-uuid-1', {
        nom: 'Nouveau Nom',
        emailContact: 'nouveau@tontine.cm',
      });

      expect(mockOrgRepo.save).toHaveBeenCalled();
    });

    it('lève ConflictError si nouvel email déjà utilisé', async () => {
      const org = makeMockOrg();
      const other = makeMockOrg({ id: 'org-uuid-2', emailContact: 'taken@tontine.cm' });
      mockOrgRepo.findOne
        .mockResolvedValueOnce(org)    // find org
        .mockResolvedValueOnce(other); // email conflict

      await expect(
        service.update('org-uuid-1', { emailContact: 'taken@tontine.cm' })
      ).rejects.toThrow('ConflictError');
    });

    it('lève NotFoundError si organisation inexistante', async () => {
      mockOrgRepo.findOne.mockResolvedValue(null);

      await expect(
        service.update('unknown-id', { nom: 'Test' })
      ).rejects.toThrow('NotFoundError');
    });
  });

  describe('suspend()', () => {
    it('passe ACTIVE → SUSPENDUE', async () => {
      const org = makeMockOrg({ statut: StatutOrganisation.ACTIVE });
      mockOrgRepo.findOne.mockResolvedValue(org);
      mockOrgRepo.save.mockResolvedValue({ ...org, statut: StatutOrganisation.SUSPENDUE });

      await service.suspend('org-uuid-1');

      expect(mockOrgRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ statut: StatutOrganisation.SUSPENDUE })
      );
    });

    it('lève BadRequestError si déjà SUSPENDUE', async () => {
      mockOrgRepo.findOne.mockResolvedValue(makeMockOrg({ statut: StatutOrganisation.SUSPENDUE }));

      await expect(service.suspend('org-uuid-1')).rejects.toThrow('BadRequestError');
    });
  });

  describe('reactivate()', () => {
    it('passe SUSPENDUE → ACTIVE', async () => {
      const org = makeMockOrg({ statut: StatutOrganisation.SUSPENDUE });
      mockOrgRepo.findOne.mockResolvedValue(org);
      mockOrgRepo.save.mockResolvedValue({ ...org, statut: StatutOrganisation.ACTIVE });

      await service.reactivate('org-uuid-1');

      expect(mockOrgRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ statut: StatutOrganisation.ACTIVE })
      );
    });

    it('lève BadRequestError si pas SUSPENDUE', async () => {
      mockOrgRepo.findOne.mockResolvedValue(makeMockOrg({ statut: StatutOrganisation.ACTIVE }));

      await expect(service.reactivate('org-uuid-1')).rejects.toThrow('BadRequestError');
    });
  });

  describe('addMembre()', () => {
    it('ajoute un membre avec le rôle spécifié', async () => {
      mockMembreRepo.findOne
        .mockResolvedValueOnce(null)  // not already member
        .mockResolvedValueOnce({
          id: 'membre-uuid-1',
          utilisateurId: 'user-uuid-1',
          role: RoleOrganisation.ORG_MEMBRE,
          statut: 'ACTIF',
          creeLe: new Date(),
          utilisateur: { prenom: 'Alice', nom: 'Dupont', telephone1: '699000000' },
        });

      const result = await service.addMembre('org-uuid-1', 'user-uuid-1', RoleOrganisation.ORG_MEMBRE);

      expect(mockMembreRepo.create).toHaveBeenCalled();
      expect(mockMembreRepo.save).toHaveBeenCalled();
      expect(result).toHaveProperty('role', RoleOrganisation.ORG_MEMBRE);
    });

    it('lève ConflictError si déjà membre', async () => {
      mockMembreRepo.findOne.mockResolvedValue({ id: 'membre-uuid-1' });

      await expect(
        service.addMembre('org-uuid-1', 'user-uuid-1', RoleOrganisation.ORG_MEMBRE)
      ).rejects.toThrow('ConflictError');
    });
  });
});
