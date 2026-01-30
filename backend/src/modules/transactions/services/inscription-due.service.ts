/**
 * Service pour la gestion des inscriptions dues par exercice
 */

import { AppDataSource } from '../../../config';
import { NotFoundError, BadRequestError } from '../../../shared';
import { InscriptionDueExercice, StatutDu } from '../entities/inscription-due-exercice.entity';
import { Exercice } from '../../exercices/entities/exercice.entity';
import { ExerciceMembre } from '../../exercices/entities/exercice-membre.entity';
import {
  InscriptionDueResponseDto,
  DueFiltersDto,
  UpdateDuePaymentDto
} from '../dto/dues.dto';

export class InscriptionDueService {
  private inscriptionDueRepository = AppDataSource.getRepository(InscriptionDueExercice);
  private exerciceRepository = AppDataSource.getRepository(Exercice);
  private exerciceMembreRepository = AppDataSource.getRepository(ExerciceMembre);

  /**
   * Générer les inscriptions dues pour un exercice
   */
  async genererPourExercice(exerciceId: string, montantDu: number): Promise<InscriptionDueResponseDto[]> {
    const exercice = await this.exerciceRepository.findOne({
      where: { id: exerciceId },
      relations: ['membres']
    });

    if (!exercice) {
      throw new NotFoundError('Exercice non trouvé');
    }

    const inscriptionsDues: InscriptionDueResponseDto[] = [];

    for (const exerciceMembre of exercice.membres) {
      const existing = await this.inscriptionDueRepository.findOne({
        where: { exerciceMembreId: exerciceMembre.id }
      });

      if (!existing) {
        const inscriptionDue = this.inscriptionDueRepository.create({
          exerciceMembreId: exerciceMembre.id,
          montantDu,
          montantPaye: 0,
          soldeRestant: montantDu,
          statut: StatutDu.EN_RETARD
        });
        await this.inscriptionDueRepository.save(inscriptionDue);
        inscriptionsDues.push(this.formatResponse(inscriptionDue));
      }
    }

    return inscriptionsDues;
  }

  /**
   * Récupérer toutes les inscriptions dues avec filtres
   */
  async findAll(filters?: DueFiltersDto): Promise<InscriptionDueResponseDto[]> {
    const queryBuilder = this.inscriptionDueRepository
      .createQueryBuilder('inscription')
      .leftJoinAndSelect('inscription.exerciceMembre', 'exerciceMembre')
      .leftJoinAndSelect('exerciceMembre.adhesionTontine', 'membre')
      .leftJoinAndSelect('exerciceMembre.exercice', 'exercice');

    if (filters?.exerciceMembreId) {
      queryBuilder.andWhere('inscription.exerciceMembreId = :exerciceMembreId', {
        exerciceMembreId: filters.exerciceMembreId
      });
    }

    if (filters?.statut) {
      queryBuilder.andWhere('inscription.statut = :statut', {
        statut: filters.statut
      });
    }

    queryBuilder.orderBy('inscription.creeLe', 'DESC');

    const inscriptions = await queryBuilder.getMany();
    return inscriptions.map((i: InscriptionDueExercice) => this.formatResponse(i));
  }

  /**
   * Récupérer une inscription due par ID
   */
  async findById(id: string): Promise<InscriptionDueResponseDto> {
    const inscriptionDue = await this.inscriptionDueRepository.findOne({
      where: { id },
      relations: ['exerciceMembre', 'exerciceMembre.adhesionTontine']
    });

    if (!inscriptionDue) {
      throw new NotFoundError('Inscription due non trouvée');
    }

    return this.formatResponse(inscriptionDue);
  }

  /**
   * Récupérer les inscriptions dues d'un exercice
   */
  async findByExercice(exerciceId: string): Promise<InscriptionDueResponseDto[]> {
    const inscriptions = await this.inscriptionDueRepository
      .createQueryBuilder('inscription')
      .leftJoinAndSelect('inscription.exerciceMembre', 'exerciceMembre')
      .leftJoinAndSelect('exerciceMembre.adhesionTontine', 'membre')
      .where('exerciceMembre.exerciceId = :exerciceId', { exerciceId })
      .orderBy('inscription.creeLe', 'ASC')
      .getMany();

    return inscriptions.map((i: InscriptionDueExercice) => this.formatResponse(i));
  }

  /**
   * Récupérer les inscriptions en retard
   */
  async findEnRetard(exerciceId?: string): Promise<InscriptionDueResponseDto[]> {
    const queryBuilder = this.inscriptionDueRepository
      .createQueryBuilder('inscription')
      .leftJoinAndSelect('inscription.exerciceMembre', 'exerciceMembre')
      .leftJoinAndSelect('exerciceMembre.adhesionTontine', 'membre')
      .where('inscription.statut = :statut', { statut: StatutDu.EN_RETARD });

    if (exerciceId) {
      queryBuilder.andWhere('exerciceMembre.exerciceId = :exerciceId', { exerciceId });
    }

    queryBuilder.orderBy('inscription.creeLe', 'ASC');

    const inscriptions = await queryBuilder.getMany();
    return inscriptions.map((i: InscriptionDueExercice) => this.formatResponse(i));
  }

  /**
   * Enregistrer un paiement d'inscription (alias)
   */
  async enregistrerPaiement(id: string, data: UpdateDuePaymentDto): Promise<InscriptionDueResponseDto> {
    return this.payer(id, data);
  }

  /**
   * Enregistrer un paiement d'inscription
   */
  async payer(id: string, data: UpdateDuePaymentDto): Promise<InscriptionDueResponseDto> {
    const inscriptionDue = await this.inscriptionDueRepository.findOne({
      where: { id }
    });

    if (!inscriptionDue) {
      throw new NotFoundError('Inscription due non trouvée');
    }

    if (data.montantPaye <= 0) {
      throw new BadRequestError('Le montant doit être positif');
    }

    inscriptionDue.montantPaye = Number(inscriptionDue.montantPaye) + data.montantPaye;
    inscriptionDue.soldeRestant = Number(inscriptionDue.montantDu) - inscriptionDue.montantPaye;

    // Mise à jour du statut
    if (inscriptionDue.soldeRestant <= 0) {
      inscriptionDue.statut = inscriptionDue.soldeRestant < 0 ? StatutDu.SURPAYE : StatutDu.A_JOUR;
      inscriptionDue.soldeRestant = Math.max(0, inscriptionDue.soldeRestant);
    }

    await this.inscriptionDueRepository.save(inscriptionDue);
    return this.findById(id);
  }

  /**
   * Statistiques des inscriptions d'un exercice (alias)
   */
  async getStatsByExercice(exerciceId: string): Promise<{
    total: number;
    totalMontantDu: number;
    totalMontantPaye: number;
    tauxRecouvrement: number;
    aJour: number;
    enRetard: number;
  }> {
    return this.getExerciceStats(exerciceId);
  }

  /**
   * Statistiques des inscriptions d'un exercice
   */
  async getExerciceStats(exerciceId: string): Promise<{
    total: number;
    totalMontantDu: number;
    totalMontantPaye: number;
    tauxRecouvrement: number;
    aJour: number;
    enRetard: number;
  }> {
    const inscriptions = await this.inscriptionDueRepository
      .createQueryBuilder('inscription')
      .leftJoin('inscription.exerciceMembre', 'exerciceMembre')
      .where('exerciceMembre.exerciceId = :exerciceId', { exerciceId })
      .getMany();

    const stats = {
      total: inscriptions.length,
      totalMontantDu: 0,
      totalMontantPaye: 0,
      tauxRecouvrement: 0,
      aJour: 0,
      enRetard: 0
    };

    inscriptions.forEach((i: InscriptionDueExercice) => {
      stats.totalMontantDu += Number(i.montantDu);
      stats.totalMontantPaye += Number(i.montantPaye);
      if (i.statut === StatutDu.A_JOUR || i.statut === StatutDu.SURPAYE) {
        stats.aJour++;
      } else {
        stats.enRetard++;
      }
    });

    if (stats.totalMontantDu > 0) {
      stats.tauxRecouvrement = Math.round((stats.totalMontantPaye / stats.totalMontantDu) * 10000) / 100;
    }

    return stats;
  }

  private formatResponse(inscriptionDue: InscriptionDueExercice): InscriptionDueResponseDto {
    return {
      id: inscriptionDue.id,
      exerciceMembreId: inscriptionDue.exerciceMembreId,
      montantDu: Number(inscriptionDue.montantDu),
      montantPaye: Number(inscriptionDue.montantPaye),
      soldeRestant: Number(inscriptionDue.soldeRestant),
      statut: inscriptionDue.statut,
      creeLe: inscriptionDue.creeLe
    };
  }
}

export const inscriptionDueService = new InscriptionDueService();
