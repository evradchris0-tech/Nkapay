/**
 * Service pour la gestion des demandes d'adhesion
 */

import { Repository, SelectQueryBuilder } from 'typeorm';
import { AppDataSource } from '../../../config';
import { NotFoundError, BadRequestError, PaginationQuery, PaginatedResult, paginate } from '../../../shared';
import { DemandeAdhesion, StatutDemandeAdhesion } from '../entities/demande-adhesion.entity';
import { Utilisateur } from '../../utilisateurs/entities/utilisateur.entity';
import { Tontine } from '../../tontines/entities/tontine.entity';
import {
  AdhesionTontine,
  StatutAdhesion,
  RoleMembre,
} from '../../tontines/entities/adhesion-tontine.entity';
import {
  CreateDemandeAdhesionDto,
  ApprouverDemandeDto,
  RefuserDemandeDto,
  DemandeAdhesionResponseDto,
  DemandeAdhesionFiltersDto,
  DemandesSummaryDto,
} from '../dto/demande-adhesion.dto';

export class DemandeAdhesionService {
  private _demandeRepo?: Repository<DemandeAdhesion>;
  private _utilisateurRepo?: Repository<Utilisateur>;
  private _tontineRepo?: Repository<Tontine>;
  private _adhesionRepo?: Repository<AdhesionTontine>;

  private get demandeRepository(): Repository<DemandeAdhesion> {
    if (!this._demandeRepo) this._demandeRepo = AppDataSource.getRepository(DemandeAdhesion);
    return this._demandeRepo;
  }

  private get utilisateurRepository(): Repository<Utilisateur> {
    if (!this._utilisateurRepo) this._utilisateurRepo = AppDataSource.getRepository(Utilisateur);
    return this._utilisateurRepo;
  }

  private get tontineRepository(): Repository<Tontine> {
    if (!this._tontineRepo) this._tontineRepo = AppDataSource.getRepository(Tontine);
    return this._tontineRepo;
  }

  private get adhesionRepository(): Repository<AdhesionTontine> {
    if (!this._adhesionRepo) this._adhesionRepo = AppDataSource.getRepository(AdhesionTontine);
    return this._adhesionRepo;
  }

  /**
   * Creer une demande d'adhesion
   */
  async create(dto: CreateDemandeAdhesionDto): Promise<DemandeAdhesionResponseDto> {
    // Verifier l'utilisateur
    const utilisateur = await this.utilisateurRepository.findOne({
      where: { id: dto.utilisateurId },
    });
    if (!utilisateur) {
      throw new NotFoundError(`Utilisateur non trouve: ${dto.utilisateurId}`);
    }

    // Verifier la tontine
    const tontine = await this.tontineRepository.findOne({ where: { id: dto.tontineId } });
    if (!tontine) {
      throw new NotFoundError(`Tontine non trouvee: ${dto.tontineId}`);
    }

    // Verifier qu'il n'y a pas de demande en cours
    const existingDemande = await this.demandeRepository.findOne({
      where: {
        utilisateurId: dto.utilisateurId,
        tontineId: dto.tontineId,
        statut: StatutDemandeAdhesion.SOUMISE,
      },
    });
    if (existingDemande) {
      throw new BadRequestError("Une demande d'adhesion est deja en cours pour cette tontine");
    }

    // Verifier que l'utilisateur n'est pas deja membre
    const existingAdhesion = await this.adhesionRepository.findOne({
      where: {
        utilisateurId: dto.utilisateurId,
        tontineId: dto.tontineId,
        statut: StatutAdhesion.ACTIVE,
      },
    });
    if (existingAdhesion) {
      throw new BadRequestError('Vous etes deja membre de cette tontine');
    }

    const demande = this.demandeRepository.create({
      utilisateurId: dto.utilisateurId,
      tontineId: dto.tontineId,
      message: dto.message || null,
      statut: StatutDemandeAdhesion.SOUMISE,
    });

    const saved = await this.demandeRepository.save(demande);
    return this.findById(saved.id);
  }

  /**
   * Approuver une demande d'adhesion
   */
  async approuver(id: string, dto: ApprouverDemandeDto): Promise<DemandeAdhesionResponseDto> {
    const demande = await this.demandeRepository.findOne({
      where: { id },
      relations: ['utilisateur', 'tontine'],
    });
    if (!demande) {
      throw new NotFoundError(`Demande non trouvee: ${id}`);
    }

    if (
      demande.statut !== StatutDemandeAdhesion.SOUMISE &&
      demande.statut !== StatutDemandeAdhesion.EN_COURS
    ) {
      throw new BadRequestError('Cette demande ne peut plus etre approuvee');
    }

    // Creer l'adhesion
    const adhesion = this.adhesionRepository.create({
      utilisateurId: demande.utilisateurId,
      tontineId: demande.tontineId,
      role: RoleMembre.MEMBRE,
      statut: StatutAdhesion.ACTIVE,
    });
    await this.adhesionRepository.save(adhesion);

    // Mettre a jour la demande
    demande.statut = StatutDemandeAdhesion.APPROUVEE;
    demande.traiteeLe = new Date();
    demande.traiteeParExerciceMembreId = dto.traiteeParExerciceMembreId;

    await this.demandeRepository.save(demande);
    return this.findById(id);
  }

  /**
   * Refuser une demande d'adhesion
   */
  async refuser(id: string, dto: RefuserDemandeDto): Promise<DemandeAdhesionResponseDto> {
    const demande = await this.demandeRepository.findOne({ where: { id } });
    if (!demande) {
      throw new NotFoundError(`Demande non trouvee: ${id}`);
    }

    if (
      demande.statut !== StatutDemandeAdhesion.SOUMISE &&
      demande.statut !== StatutDemandeAdhesion.EN_COURS
    ) {
      throw new BadRequestError('Cette demande ne peut plus etre refusee');
    }

    demande.statut = StatutDemandeAdhesion.REFUSEE;
    demande.traiteeLe = new Date();
    demande.traiteeParExerciceMembreId = dto.traiteeParExerciceMembreId;
    demande.motifRefus = dto.motifRefus;

    await this.demandeRepository.save(demande);
    return this.findById(id);
  }

  /**
   * Mettre une demande en cours de traitement
   */
  async mettreEnCours(id: string): Promise<DemandeAdhesionResponseDto> {
    const demande = await this.demandeRepository.findOne({ where: { id } });
    if (!demande) {
      throw new NotFoundError(`Demande non trouvee: ${id}`);
    }

    if (demande.statut !== StatutDemandeAdhesion.SOUMISE) {
      throw new BadRequestError('Seule une demande soumise peut etre mise en cours');
    }

    demande.statut = StatutDemandeAdhesion.EN_COURS;

    await this.demandeRepository.save(demande);
    return this.findById(id);
  }

  /**
   * Lister les demandes d'adhesion
   */
  async findAll(
    filters?: DemandeAdhesionFiltersDto,
    pagination?: PaginationQuery
  ): Promise<PaginatedResult<DemandeAdhesionResponseDto>> {
    const queryBuilder = this.demandeRepository
      .createQueryBuilder('d')
      .leftJoinAndSelect('d.utilisateur', 'utilisateur')
      .leftJoinAndSelect('d.tontine', 'tontine');

    if (filters?.tontineId) {
      queryBuilder.andWhere('d.tontineId = :tontineId', { tontineId: filters.tontineId });
    }
    if (filters?.utilisateurId) {
      queryBuilder.andWhere('d.utilisateurId = :utilisateurId', {
        utilisateurId: filters.utilisateurId,
      });
    }
    if (filters?.statut) {
      queryBuilder.andWhere('d.statut = :statut', { statut: filters.statut });
    }
    if (filters?.dateDebut) {
      queryBuilder.andWhere('d.soumiseLe >= :dateDebut', { dateDebut: filters.dateDebut });
    }
    if (filters?.dateFin) {
      queryBuilder.andWhere('d.soumiseLe <= :dateFin', { dateFin: filters.dateFin });
    }

    queryBuilder.orderBy('d.soumiseLe', 'DESC');

    const result = await paginate<DemandeAdhesion>(queryBuilder as SelectQueryBuilder<DemandeAdhesion>, pagination ?? {});
    return {
      data: result.data.map((d) => this.toResponseDto(d)),
      meta: result.meta,
    };
  }

  /**
   * Trouver une demande par ID
   */
  async findById(id: string): Promise<DemandeAdhesionResponseDto> {
    const demande = await this.demandeRepository.findOne({
      where: { id },
      relations: ['utilisateur', 'tontine'],
    });

    if (!demande) {
      throw new NotFoundError(`Demande non trouvee: ${id}`);
    }

    return this.toResponseDto(demande);
  }

  /**
   * Supprimer une demande
   */
  async delete(id: string): Promise<void> {
    const demande = await this.demandeRepository.findOne({ where: { id } });
    if (!demande) {
      throw new NotFoundError(`Demande non trouvee: ${id}`);
    }

    if (demande.statut === StatutDemandeAdhesion.APPROUVEE) {
      throw new BadRequestError('Une demande approuvee ne peut pas etre supprimee');
    }

    await this.demandeRepository.remove(demande);
  }

  /**
   * Obtenir le resume des demandes
   */
  async getSummary(filters?: DemandeAdhesionFiltersDto): Promise<DemandesSummaryDto> {
    const { data: demandes } = await this.findAll(filters, { limit: 1000 });

    let demandesSoumises = 0;
    let demandesEnCours = 0;
    let demandesApprouvees = 0;
    let demandesRefusees = 0;
    let demandesExpirees = 0;

    for (const d of demandes) {
      switch (d.statut) {
        case StatutDemandeAdhesion.SOUMISE:
          demandesSoumises++;
          break;
        case StatutDemandeAdhesion.EN_COURS:
          demandesEnCours++;
          break;
        case StatutDemandeAdhesion.APPROUVEE:
          demandesApprouvees++;
          break;
        case StatutDemandeAdhesion.REFUSEE:
          demandesRefusees++;
          break;
        case StatutDemandeAdhesion.EXPIREE:
          demandesExpirees++;
          break;
      }
    }

    return {
      totalDemandes: demandes.length,
      demandesSoumises,
      demandesEnCours,
      demandesApprouvees,
      demandesRefusees,
      demandesExpirees,
    };
  }

  /**
   * Transformer en DTO de reponse
   */
  private toResponseDto(entity: DemandeAdhesion): DemandeAdhesionResponseDto {
    return {
      id: entity.id,
      utilisateurId: entity.utilisateurId,
      utilisateur: entity.utilisateur
        ? {
            id: entity.utilisateur.id,
            nom: entity.utilisateur.nom,
            prenom: entity.utilisateur.prenom,

            telephone: entity.utilisateur.telephone1,
          }
        : undefined,
      tontineId: entity.tontineId,
      tontine: entity.tontine
        ? {
            id: entity.tontine.id,
            nom: entity.tontine.nom,
          }
        : undefined,
      message: entity.message,
      statut: entity.statut,
      soumiseLe: entity.soumiseLe,
      traiteeLe: entity.traiteeLe,
      traiteeParExerciceMembreId: entity.traiteeParExerciceMembreId,
      motifRefus: entity.motifRefus,
    };
  }
}

export const demandeAdhesionService = new DemandeAdhesionService();
