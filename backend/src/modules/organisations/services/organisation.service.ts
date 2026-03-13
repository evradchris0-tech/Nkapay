import { Repository } from 'typeorm';
import { AppDataSource } from '../../../config';
import { NotFoundError, BadRequestError, ConflictError } from '../../../shared';
import { Organisation, StatutOrganisation } from '../entities/organisation.entity';
import { PlanAbonnement } from '../entities/plan-abonnement.entity';
import { MembreOrganisation, RoleOrganisation } from '../entities/membre-organisation.entity';
import {
  CreateOrganisationDto,
  UpdateOrganisationDto,
  OrganisationResponseDto,
  MembreOrganisationResponseDto,
} from '../dto/organisation.dto';

export class OrganisationService {
  private _orgRepo?: Repository<Organisation>;
  private _planRepo?: Repository<PlanAbonnement>;
  private _membreRepo?: Repository<MembreOrganisation>;

  private get orgRepo(): Repository<Organisation> {
    if (!this._orgRepo) this._orgRepo = AppDataSource.getRepository(Organisation);
    return this._orgRepo;
  }

  private get planRepo(): Repository<PlanAbonnement> {
    if (!this._planRepo) this._planRepo = AppDataSource.getRepository(PlanAbonnement);
    return this._planRepo;
  }

  private get membreRepo(): Repository<MembreOrganisation> {
    if (!this._membreRepo) this._membreRepo = AppDataSource.getRepository(MembreOrganisation);
    return this._membreRepo;
  }

  async create(dto: CreateOrganisationDto): Promise<OrganisationResponseDto> {
    // Vérifier unicité du slug
    const existing = await this.orgRepo.findOne({ where: { slug: dto.slug } });
    if (existing) throw new ConflictError(`Le slug "${dto.slug}" est déjà utilisé`);

    // Vérifier unicité de l'email
    const emailExisting = await this.orgRepo.findOne({ where: { emailContact: dto.emailContact } });
    if (emailExisting) throw new ConflictError(`L'email "${dto.emailContact}" est déjà utilisé`);

    let planId: string | null = null;
    if (dto.planAbonnementId) {
      const plan = await this.planRepo.findOne({ where: { id: dto.planAbonnementId } });
      if (!plan) throw new NotFoundError(`Plan introuvable: ${dto.planAbonnementId}`);
      planId = plan.id;
    } else {
      // Plan FREE par défaut
      const freePlan = await this.planRepo.findOne({ where: { code: 'FREE' } });
      planId = freePlan?.id ?? null;
    }

    const org = this.orgRepo.create({
      nom: dto.nom,
      slug: dto.slug,
      emailContact: dto.emailContact,
      telephoneContact: dto.telephoneContact ?? null,
      pays: dto.pays ?? 'CM',
      devise: dto.devise ?? 'XAF',
      fuseauHoraire: dto.fuseauHoraire ?? 'Africa/Douala',
      planAbonnementId: planId,
      abonnementDebutLe: new Date(),
    });

    const saved = await this.orgRepo.save(org);
    return this.toResponseDto(saved);
  }

  async findById(id: string): Promise<OrganisationResponseDto> {
    const org = await this.orgRepo.findOne({
      where: { id },
      relations: ['planAbonnement'],
    });
    if (!org) throw new NotFoundError(`Organisation introuvable: ${id}`);
    return this.toResponseDto(org);
  }

  async findAll(): Promise<OrganisationResponseDto[]> {
    const orgs = await this.orgRepo.find({
      relations: ['planAbonnement'],
      order: { creeLe: 'DESC' },
    });
    return orgs.map((o) => this.toResponseDto(o));
  }

  async update(id: string, dto: UpdateOrganisationDto): Promise<OrganisationResponseDto> {
    const org = await this.orgRepo.findOne({ where: { id } });
    if (!org) throw new NotFoundError(`Organisation introuvable: ${id}`);

    if (dto.emailContact && dto.emailContact !== org.emailContact) {
      const emailUsed = await this.orgRepo.findOne({ where: { emailContact: dto.emailContact } });
      if (emailUsed) throw new ConflictError(`L'email "${dto.emailContact}" est déjà utilisé`);
    }

    Object.assign(org, {
      nom: dto.nom ?? org.nom,
      emailContact: dto.emailContact ?? org.emailContact,
      telephoneContact: dto.telephoneContact ?? org.telephoneContact,
      pays: dto.pays ?? org.pays,
      devise: dto.devise ?? org.devise,
      fuseauHoraire: dto.fuseauHoraire ?? org.fuseauHoraire,
      logo: dto.logo ?? org.logo,
    });

    const saved = await this.orgRepo.save(org);
    return this.toResponseDto(saved);
  }

  async suspend(id: string): Promise<OrganisationResponseDto> {
    const org = await this.orgRepo.findOne({ where: { id } });
    if (!org) throw new NotFoundError(`Organisation introuvable: ${id}`);
    if (org.statut === StatutOrganisation.SUSPENDUE)
      throw new BadRequestError('Organisation déjà suspendue');

    org.statut = StatutOrganisation.SUSPENDUE;
    const saved = await this.orgRepo.save(org);
    return this.toResponseDto(saved);
  }

  async reactivate(id: string): Promise<OrganisationResponseDto> {
    const org = await this.orgRepo.findOne({ where: { id } });
    if (!org) throw new NotFoundError(`Organisation introuvable: ${id}`);
    if (org.statut !== StatutOrganisation.SUSPENDUE)
      throw new BadRequestError('Organisation non suspendue');

    org.statut = StatutOrganisation.ACTIVE;
    const saved = await this.orgRepo.save(org);
    return this.toResponseDto(saved);
  }

  async getMembres(organisationId: string): Promise<MembreOrganisationResponseDto[]> {
    const membres = await this.membreRepo.find({
      where: { organisationId },
      relations: ['utilisateur'],
      order: { creeLe: 'ASC' },
    });

    return membres.map((m) => ({
      id: m.id,
      utilisateurId: m.utilisateurId,
      prenom: m.utilisateur?.prenom ?? '',
      nom: m.utilisateur?.nom ?? '',
      telephone1: m.utilisateur?.telephone1 ?? '',
      email: (m.utilisateur as any)?.email ?? null,
      role: m.role,
      statut: m.statut,
      creeLe: m.creeLe,
    }));
  }

  async addMembre(
    organisationId: string,
    utilisateurId: string,
    role: RoleOrganisation,
    inviteParUtilisateurId?: string
  ): Promise<MembreOrganisationResponseDto> {
    const existing = await this.membreRepo.findOne({
      where: { organisationId, utilisateurId },
    });
    if (existing) throw new ConflictError('Utilisateur déjà membre de cette organisation');

    const membre = this.membreRepo.create({
      organisationId,
      utilisateurId,
      role,
      inviteParUtilisateurId: inviteParUtilisateurId ?? null,
    });

    const saved = await this.membreRepo.save(membre);
    const full = await this.membreRepo.findOne({
      where: { id: saved.id },
      relations: ['utilisateur'],
    });

    return {
      id: full!.id,
      utilisateurId: full!.utilisateurId,
      prenom: full!.utilisateur?.prenom ?? '',
      nom: full!.utilisateur?.nom ?? '',
      telephone1: full!.utilisateur?.telephone1 ?? '',
      email: (full!.utilisateur as any)?.email ?? null,
      role: full!.role,
      statut: full!.statut,
      creeLe: full!.creeLe,
    };
  }

  async countTontines(organisationId: string): Promise<number> {
    return AppDataSource.getRepository('Tontine').count({
      where: { organisationId } as any,
    });
  }

  async findWithPlan(organisationId: string): Promise<Organisation & { plan: PlanAbonnement | null }> {
    const org = await this.orgRepo.findOne({
      where: { id: organisationId },
      relations: ['planAbonnement'],
    });
    if (!org) throw new NotFoundError(`Organisation introuvable: ${organisationId}`);
    return { ...org, plan: org.planAbonnement };
  }

  private toResponseDto(org: Organisation): OrganisationResponseDto {
    return {
      id: org.id,
      nom: org.nom,
      slug: org.slug,
      emailContact: org.emailContact,
      telephoneContact: org.telephoneContact,
      pays: org.pays,
      devise: org.devise,
      fuseauHoraire: org.fuseauHoraire,
      logo: org.logo,
      statut: org.statut,
      planAbonnementId: org.planAbonnementId,
      planCode: org.planAbonnement?.code,
      planLibelle: org.planAbonnement?.libelle,
      abonnementDebutLe: org.abonnementDebutLe,
      abonnementFinLe: org.abonnementFinLe,
      creeLe: org.creeLe,
      modifieLe: org.modifieLe,
    };
  }
}

export const organisationService = new OrganisationService();
