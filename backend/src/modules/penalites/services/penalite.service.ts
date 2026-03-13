/**
 * Service pour la gestion des penalites
 */

import { Repository } from 'typeorm';
import { AppDataSource } from '../../../config';
import { NotFoundError, BadRequestError, PaginationQuery, PaginatedResult, paginate } from '../../../shared';
import { Penalite, StatutPenalite } from '../entities/penalite.entity';
import { TypePenalite } from '../entities/type-penalite.entity';
import { ExerciceMembre } from '../../exercices/entities/exercice-membre.entity';
import {
  CreatePenaliteDto,
  PayerPenaliteDto,
  AnnulerPenaliteDto,
  PenaliteResponseDto,
  PenaliteFiltersDto,
  PenalitesSummaryDto,
} from '../dto/penalite.dto';
import { regleExerciceService } from '../../exercices/services/regle-exercice.service';

export class PenaliteService {
  private _penaliteRepo?: Repository<Penalite>;
  private _typePenaliteRepo?: Repository<TypePenalite>;
  private _exerciceMembreRepo?: Repository<ExerciceMembre>;

  private get penaliteRepository(): Repository<Penalite> {
    if (!this._penaliteRepo) this._penaliteRepo = AppDataSource.getRepository(Penalite);
    return this._penaliteRepo;
  }

  private get typePenaliteRepository(): Repository<TypePenalite> {
    if (!this._typePenaliteRepo) this._typePenaliteRepo = AppDataSource.getRepository(TypePenalite);
    return this._typePenaliteRepo;
  }

  private get exerciceMembreRepository(): Repository<ExerciceMembre> {
    if (!this._exerciceMembreRepo)
      this._exerciceMembreRepo = AppDataSource.getRepository(ExerciceMembre);
    return this._exerciceMembreRepo;
  }

  /**
   * Appliquer une penalite
   */
  async create(dto: CreatePenaliteDto): Promise<PenaliteResponseDto> {
    // Verifier que le membre existe
    const membre = await this.exerciceMembreRepository.findOne({
      where: { id: dto.exerciceMembreId },
      relations: ['adhesionTontine', 'adhesionTontine.utilisateur'],
    });
    if (!membre) {
      throw new NotFoundError(`Membre d'exercice non trouve: ${dto.exerciceMembreId}`);
    }

    // Verifier que le type de penalite existe
    const typePenalite = await this.typePenaliteRepository.findOne({
      where: { id: dto.typePenaliteId },
    });
    if (!typePenalite) {
      throw new NotFoundError(`Type de penalite non trouve: ${dto.typePenaliteId}`);
    }

    // Determiner le montant
    let montant = dto.montant;
    if (montant === undefined || montant === null) {
      // 1. Essayer de trouver une règle avec le CODE du type de pénalité (ex: 'PENALITE_RETARD_REUNION')
      const ruleValue = await regleExerciceService.getEffectiveValueByCle(
        membre.exerciceId,
        typePenalite.code
      );
      if (ruleValue) {
        montant = parseFloat(ruleValue);
      } else {
        // 2. Sinon, utiliser la valeur par défaut définie dans le TypePenalite
        montant = typePenalite.valeurDefaut || 0;
      }
    }

    const penalite = this.penaliteRepository.create({
      exerciceMembreId: dto.exerciceMembreId,
      reunionId: dto.reunionId || null,
      typePenaliteId: dto.typePenaliteId,
      montant: montant,
      motif: dto.motif || null,
      statut: StatutPenalite.EN_ATTENTE,
      appliqueParExerciceMembreId: dto.appliqueParExerciceMembreId || null,
    });

    const saved = await this.penaliteRepository.save(penalite);
    return this.findById(saved.id);
  }

  /**
   * Payer une penalite
   */
  async payer(id: string, dto: PayerPenaliteDto): Promise<PenaliteResponseDto> {
    const penalite = await this.penaliteRepository.findOne({ where: { id } });
    if (!penalite) {
      throw new NotFoundError(`Penalite non trouvee: ${id}`);
    }

    if (penalite.statut !== StatutPenalite.EN_ATTENTE) {
      throw new BadRequestError('Seule une penalite en attente peut etre payee');
    }

    penalite.statut = StatutPenalite.PAYEE;
    penalite.transactionId = dto.transactionId;
    penalite.datePaiement = new Date();

    await this.penaliteRepository.save(penalite);
    return this.findById(id);
  }

  /**
   * Annuler une penalite
   */
  async annuler(id: string, dto: AnnulerPenaliteDto): Promise<PenaliteResponseDto> {
    const penalite = await this.penaliteRepository.findOne({ where: { id } });
    if (!penalite) {
      throw new NotFoundError(`Penalite non trouvee: ${id}`);
    }

    if (penalite.statut === StatutPenalite.PAYEE) {
      throw new BadRequestError('Une penalite deja payee ne peut pas etre annulee');
    }

    penalite.statut = StatutPenalite.ANNULEE;
    penalite.dateAnnulation = new Date();
    penalite.motifAnnulation = dto.motifAnnulation;

    await this.penaliteRepository.save(penalite);
    return this.findById(id);
  }

  /**
   * Pardonner une penalite
   */
  async pardonner(id: string, motif: string): Promise<PenaliteResponseDto> {
    const penalite = await this.penaliteRepository.findOne({ where: { id } });
    if (!penalite) {
      throw new NotFoundError(`Penalite non trouvee: ${id}`);
    }

    if (penalite.statut !== StatutPenalite.EN_ATTENTE) {
      throw new BadRequestError('Seule une penalite en attente peut etre pardonnee');
    }

    penalite.statut = StatutPenalite.PARDONNEE;
    penalite.motifAnnulation = motif;

    await this.penaliteRepository.save(penalite);
    return this.findById(id);
  }

  /**
   * Lister les penalites avec pagination
   */
  async findAll(
    filters?: PenaliteFiltersDto,
    pagination?: PaginationQuery
  ): Promise<PaginatedResult<PenaliteResponseDto>> {
    const queryBuilder = this.penaliteRepository
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.exerciceMembre', 'em')
      .leftJoinAndSelect('em.adhesionTontine', 'adhesion')
      .leftJoinAndSelect('adhesion.utilisateur', 'utilisateur')
      .leftJoinAndSelect('p.typePenalite', 'tp');

    if (filters?.exerciceId) {
      queryBuilder.andWhere('em.exerciceId = :exerciceId', { exerciceId: filters.exerciceId });
    }
    if (filters?.exerciceMembreId) {
      queryBuilder.andWhere('p.exerciceMembreId = :exerciceMembreId', {
        exerciceMembreId: filters.exerciceMembreId,
      });
    }
    if (filters?.reunionId) {
      queryBuilder.andWhere('p.reunionId = :reunionId', { reunionId: filters.reunionId });
    }
    if (filters?.typePenaliteId) {
      queryBuilder.andWhere('p.typePenaliteId = :typePenaliteId', {
        typePenaliteId: filters.typePenaliteId,
      });
    }
    if (filters?.statut) {
      queryBuilder.andWhere('p.statut = :statut', { statut: filters.statut });
    }
    if (filters?.dateDebut) {
      queryBuilder.andWhere('p.dateApplication >= :dateDebut', { dateDebut: filters.dateDebut });
    }
    if (filters?.dateFin) {
      queryBuilder.andWhere('p.dateApplication <= :dateFin', { dateFin: filters.dateFin });
    }

    queryBuilder.orderBy('p.dateApplication', 'DESC');

    const result = await paginate(queryBuilder, pagination ?? {});
    return {
      ...result,
      data: result.data.map((p) => this.toResponseDto(p)),
    };
  }

  /**
   * Trouver une penalite par ID
   */
  async findById(id: string): Promise<PenaliteResponseDto> {
    const penalite = await this.penaliteRepository.findOne({
      where: { id },
      relations: [
        'exerciceMembre',
        'exerciceMembre.adhesionTontine',
        'exerciceMembre.adhesionTontine.utilisateur',
        'typePenalite',
      ],
    });

    if (!penalite) {
      throw new NotFoundError(`Penalite non trouvee: ${id}`);
    }

    return this.toResponseDto(penalite);
  }

  /**
   * Obtenir le resume des penalites
   */
  async getSummary(filters?: PenaliteFiltersDto): Promise<PenalitesSummaryDto> {
    const { data: penalites } = await this.findAll(filters, { limit: 1000 });

    const totalPenalites = penalites.length;
    const totalMontant = penalites.reduce((sum, p) => sum + Number(p.montant), 0);
    const penalitesPayees = penalites.filter((p) => p.statut === StatutPenalite.PAYEE);
    const penalitesEnAttente = penalites.filter((p) => p.statut === StatutPenalite.EN_ATTENTE);
    const penalitesAnnulees = penalites.filter((p) => p.statut === StatutPenalite.ANNULEE);
    const penalitesPardonnees = penalites.filter((p) => p.statut === StatutPenalite.PARDONNEE);

    return {
      totalPenalites,
      totalMontant,
      totalMontantPaye: penalitesPayees.reduce((sum, p) => sum + Number(p.montant), 0),
      totalMontantEnAttente: penalitesEnAttente.reduce((sum, p) => sum + Number(p.montant), 0),
      penalitesEnAttente: penalitesEnAttente.length,
      penalitesPayees: penalitesPayees.length,
      penalitesAnnulees: penalitesAnnulees.length,
      penalitesPardonnees: penalitesPardonnees.length,
    };
  }

  /**
   * Transformer en DTO de reponse
   */
  private toResponseDto(entity: Penalite): PenaliteResponseDto {
    const utilisateur = entity.exerciceMembre?.adhesionTontine?.utilisateur;

    return {
      id: entity.id,
      exerciceMembreId: entity.exerciceMembreId,
      exerciceMembre: entity.exerciceMembre
        ? {
            id: entity.exerciceMembre.id,
            utilisateurId: utilisateur?.id || '',
            utilisateurNom: utilisateur ? `${utilisateur.prenom} ${utilisateur.nom}` : undefined,
          }
        : undefined,
      reunionId: entity.reunionId,
      typePenaliteId: entity.typePenaliteId,
      typePenalite: entity.typePenalite
        ? {
            id: entity.typePenalite.id,
            code: entity.typePenalite.code,
            libelle: entity.typePenalite.libelle,
          }
        : undefined,
      montant: Number(entity.montant),
      motif: entity.motif,
      statut: entity.statut,
      dateApplication: entity.dateApplication,
      appliqueParExerciceMembreId: entity.appliqueParExerciceMembreId,
      transactionId: entity.transactionId,
      datePaiement: entity.datePaiement,
      dateAnnulation: entity.dateAnnulation,
      motifAnnulation: entity.motifAnnulation,
    };
  }
}

export const penaliteService = new PenaliteService();
