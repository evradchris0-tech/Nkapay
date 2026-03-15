/**
 * Service pour la gestion des distributions
 */

import { Repository } from 'typeorm';
import { AppDataSource } from '../../../config';
import { NotFoundError, BadRequestError } from '../../../shared';
import { Distribution, StatutDistribution } from '../entities/distribution.entity';
import { ExerciceMembre } from '../../exercices/entities/exercice-membre.entity';
import { Reunion } from '../../reunions/entities/reunion.entity';
import {
  CreateDistributionDto,
  UpdateDistributionDto,
  DistribuerDto,
  DistributionResponseDto,
  DistributionFiltersDto,
  DistributionsSummaryDto,
} from '../dto/distribution.dto';

export class DistributionService {
  private _distributionRepo?: Repository<Distribution>;
  private _exerciceMembreRepo?: Repository<ExerciceMembre>;
  private _reunionRepo?: Repository<Reunion>;

  private get distributionRepository(): Repository<Distribution> {
    if (!this._distributionRepo) this._distributionRepo = AppDataSource.getRepository(Distribution);
    return this._distributionRepo;
  }

  private get exerciceMembreRepository(): Repository<ExerciceMembre> {
    if (!this._exerciceMembreRepo) this._exerciceMembreRepo = AppDataSource.getRepository(ExerciceMembre);
    return this._exerciceMembreRepo;
  }

  private get reunionRepository(): Repository<Reunion> {
    if (!this._reunionRepo) this._reunionRepo = AppDataSource.getRepository(Reunion);
    return this._reunionRepo;
  }

  /**
   * Creer une distribution
   */
  async create(dto: CreateDistributionDto): Promise<DistributionResponseDto> {
    // Verifier le beneficiaire
    const beneficiaire = await this.exerciceMembreRepository.findOne({ where: { id: dto.exerciceMembreBeneficiaireId } });
    if (!beneficiaire) {
      throw new NotFoundError(`Membre d'exercice non trouve: ${dto.exerciceMembreBeneficiaireId}`);
    }

    // Verifier la reunion
    const reunion = await this.reunionRepository.findOne({ where: { id: dto.reunionId } });
    if (!reunion) {
      throw new NotFoundError(`Reunion non trouvee: ${dto.reunionId}`);
    }

    // Verifier l'unicite de l'ordre
    const existingOrdre = await this.distributionRepository.findOne({
      where: { reunionId: dto.reunionId, ordre: dto.ordre },
    });
    if (existingOrdre) {
      throw new BadRequestError(`Une distribution avec l'ordre ${dto.ordre} existe deja pour cette reunion`);
    }

    const montantRetenu = dto.montantRetenu || 0;
    const montantNet = dto.montantBrut - montantRetenu;

    const distribution = this.distributionRepository.create({
      reunionId: dto.reunionId,
      exerciceMembreBeneficiaireId: dto.exerciceMembreBeneficiaireId,
      ordre: dto.ordre,
      montantBrut: dto.montantBrut,
      montantRetenu,
      montantNet,
      statut: StatutDistribution.PLANIFIEE,
      commentaire: dto.commentaire || null,
    });

    const saved = await this.distributionRepository.save(distribution);
    return this.findById(saved.id);
  }

  /**
   * Effectuer une distribution
   */
  async distribuer(id: string, dto: DistribuerDto): Promise<DistributionResponseDto> {
    const distribution = await this.distributionRepository.findOne({ where: { id } });
    if (!distribution) {
      throw new NotFoundError(`Distribution non trouvee: ${id}`);
    }

    if (distribution.statut !== StatutDistribution.PLANIFIEE) {
      throw new BadRequestError('Seule une distribution planifiee peut etre effectuee');
    }

    distribution.statut = StatutDistribution.DISTRIBUEE;
    distribution.distribueeLe = new Date();
    if (dto.transactionId) {
      distribution.transactionId = dto.transactionId;
    }

    await this.distributionRepository.save(distribution);
    return this.findById(id);
  }

  /**
   * Annuler une distribution
   */
  async annuler(id: string): Promise<DistributionResponseDto> {
    const distribution = await this.distributionRepository.findOne({ where: { id } });
    if (!distribution) {
      throw new NotFoundError(`Distribution non trouvee: ${id}`);
    }

    if (distribution.statut === StatutDistribution.DISTRIBUEE) {
      throw new BadRequestError('Une distribution effectuee ne peut pas etre annulee');
    }

    distribution.statut = StatutDistribution.ANNULEE;

    await this.distributionRepository.save(distribution);
    return this.findById(id);
  }

  /**
   * Lister les distributions
   */
  async findAll(filters?: DistributionFiltersDto): Promise<{ distributions: DistributionResponseDto[]; total: number }> {
    const queryBuilder = this.distributionRepository
      .createQueryBuilder('d')
      .leftJoinAndSelect('d.exerciceMembreBeneficiaire', 'em')
      .leftJoinAndSelect('em.adhesionTontine', 'adhesion')
      .leftJoinAndSelect('adhesion.utilisateur', 'utilisateur');

    if (filters?.reunionId) {
      queryBuilder.andWhere('d.reunionId = :reunionId', { reunionId: filters.reunionId });
    }
    if (filters?.exerciceId) {
      queryBuilder.andWhere('em.exerciceId = :exerciceId', { exerciceId: filters.exerciceId });
    }
    if (filters?.exerciceMembreId) {
      queryBuilder.andWhere('d.exerciceMembreBeneficiaireId = :exerciceMembreId', { exerciceMembreId: filters.exerciceMembreId });
    }
    if (filters?.statut) {
      queryBuilder.andWhere('d.statut = :statut', { statut: filters.statut });
    }

    const [distributions, total] = await queryBuilder
      .orderBy('d.ordre', 'ASC')
      .getManyAndCount();

    return {
      distributions: distributions.map((d) => this.toResponseDto(d)),
      total,
    };
  }

  /**
   * Trouver une distribution par ID
   */
  async findById(id: string): Promise<DistributionResponseDto> {
    const distribution = await this.distributionRepository.findOne({
      where: { id },
      relations: ['exerciceMembreBeneficiaire', 'exerciceMembreBeneficiaire.adhesionTontine', 'exerciceMembreBeneficiaire.adhesionTontine.utilisateur'],
    });

    if (!distribution) {
      throw new NotFoundError(`Distribution non trouvee: ${id}`);
    }

    return this.toResponseDto(distribution);
  }

  /**
   * Trouver les distributions d'une reunion
   */
  async findByReunion(reunionId: string): Promise<DistributionResponseDto[]> {
    const distributions = await this.distributionRepository.find({
      where: { reunionId },
      relations: ['exerciceMembreBeneficiaire', 'exerciceMembreBeneficiaire.adhesionTontine', 'exerciceMembreBeneficiaire.adhesionTontine.utilisateur'],
      order: { ordre: 'ASC' },
    });
    return distributions.map((d) => this.toResponseDto(d));
  }

  /**
   * Mettre a jour une distribution
   */
  async update(id: string, dto: UpdateDistributionDto): Promise<DistributionResponseDto> {
    const distribution = await this.distributionRepository.findOne({ where: { id } });
    if (!distribution) {
      throw new NotFoundError(`Distribution non trouvee: ${id}`);
    }

    if (distribution.statut !== StatutDistribution.PLANIFIEE) {
      throw new BadRequestError('Seule une distribution planifiee peut etre modifiee');
    }

    if (dto.ordre !== undefined) {
      // Verifier l'unicite du nouvel ordre
      const existingOrdre = await this.distributionRepository.findOne({
        where: { reunionId: distribution.reunionId, ordre: dto.ordre },
      });
      if (existingOrdre && existingOrdre.id !== id) {
        throw new BadRequestError(`Une distribution avec l'ordre ${dto.ordre} existe deja pour cette reunion`);
      }
      distribution.ordre = dto.ordre;
    }

    if (dto.montantBrut !== undefined) {
      distribution.montantBrut = dto.montantBrut;
    }
    if (dto.montantRetenu !== undefined) {
      distribution.montantRetenu = dto.montantRetenu;
    }
    if (dto.commentaire !== undefined) {
      distribution.commentaire = dto.commentaire;
    }

    // Recalculer le montant net
    distribution.montantNet = Number(distribution.montantBrut) - Number(distribution.montantRetenu);

    await this.distributionRepository.save(distribution);
    return this.findById(id);
  }

  /**
   * Supprimer une distribution
   */
  async delete(id: string): Promise<void> {
    const distribution = await this.distributionRepository.findOne({ where: { id } });
    if (!distribution) {
      throw new NotFoundError(`Distribution non trouvee: ${id}`);
    }

    if (distribution.statut === StatutDistribution.DISTRIBUEE) {
      throw new BadRequestError('Une distribution effectuee ne peut pas etre supprimee');
    }

    await this.distributionRepository.remove(distribution);
  }

  /**
   * Obtenir le resume des distributions
   */
  async getSummary(filters?: DistributionFiltersDto): Promise<DistributionsSummaryDto> {
    const { distributions } = await this.findAll(filters);

    let totalMontantBrut = 0;
    let totalMontantRetenu = 0;
    let totalMontantNet = 0;
    let distributionsPlanifiees = 0;
    let distributionsEffectuees = 0;
    let distributionsAnnulees = 0;

    for (const dist of distributions) {
      totalMontantBrut += dist.montantBrut;
      totalMontantRetenu += dist.montantRetenu;
      totalMontantNet += dist.montantNet;

      if (dist.statut === StatutDistribution.PLANIFIEE) {
        distributionsPlanifiees++;
      } else if (dist.statut === StatutDistribution.DISTRIBUEE) {
        distributionsEffectuees++;
      } else if (dist.statut === StatutDistribution.ANNULEE) {
        distributionsAnnulees++;
      }
    }

    return {
      totalDistributions: distributions.length,
      totalMontantBrut,
      totalMontantRetenu,
      totalMontantNet,
      distributionsPlanifiees,
      distributionsEffectuees,
      distributionsAnnulees,
    };
  }

  /**
   * Transformer en DTO de reponse
   */
  private toResponseDto(entity: Distribution): DistributionResponseDto {
    const utilisateur = entity.exerciceMembreBeneficiaire?.adhesionTontine?.utilisateur;

    return {
      id: entity.id,
      reunionId: entity.reunionId,
      exerciceMembreBeneficiaireId: entity.exerciceMembreBeneficiaireId,
      exerciceMembreBeneficiaire: entity.exerciceMembreBeneficiaire ? {
        id: entity.exerciceMembreBeneficiaire.id,
        utilisateurId: utilisateur?.id || '',
        utilisateurNom: utilisateur ? `${utilisateur.prenom} ${utilisateur.nom}` : undefined,
      } : undefined,
      ordre: entity.ordre,
      montantBrut: Number(entity.montantBrut),
      montantRetenu: Number(entity.montantRetenu),
      montantNet: Number(entity.montantNet),
      statut: entity.statut,
      transactionId: entity.transactionId,
      creeLe: entity.creeLe,
      distribueeLe: entity.distribueeLe,
      commentaire: entity.commentaire,
    };
  }
}

export const distributionService = new DistributionService();
