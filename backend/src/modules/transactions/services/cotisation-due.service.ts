/**
 * Service pour la gestion des cotisations dues mensuelles
 */

import { AppDataSource } from '../../../config';
import { NotFoundError, BadRequestError } from '../../../shared';
import { CotisationDueMensuelle } from '../entities/cotisation-due-mensuelle.entity';
import { StatutDu } from '../entities/inscription-due-exercice.entity';
import { Reunion } from '../../reunions/entities/reunion.entity';
import { ExerciceMembre } from '../../exercices/entities/exercice-membre.entity';
import {
  CotisationDueResponseDto,
  DueFiltersDto,
  UpdateDuePaymentDto
} from '../dto/dues.dto';

export class CotisationDueService {
  private cotisationDueRepository = AppDataSource.getRepository(CotisationDueMensuelle);
  private reunionRepository = AppDataSource.getRepository(Reunion);
  private exerciceMembreRepository = AppDataSource.getRepository(ExerciceMembre);

  /**
   * Générer les cotisations dues pour une réunion
   */
  async genererPourReunion(reunionId: string, montantDu: number): Promise<CotisationDueResponseDto[]> {
    const reunion = await this.reunionRepository.findOne({
      where: { id: reunionId },
      relations: ['exercice', 'exercice.membres']
    });

    if (!reunion) {
      throw new NotFoundError('Réunion non trouvée');
    }

    const cotisationsDues: CotisationDueResponseDto[] = [];

    for (const exerciceMembre of reunion.exercice.membres) {
      const existing = await this.cotisationDueRepository.findOne({
        where: {
          reunionId,
          exerciceMembreId: exerciceMembre.id
        }
      });

      if (!existing) {
        const cotisationDue = this.cotisationDueRepository.create({
          reunionId,
          exerciceMembreId: exerciceMembre.id,
          montantDu,
          montantPaye: 0,
          soldeRestant: montantDu,
          statut: StatutDu.EN_RETARD
        });
        await this.cotisationDueRepository.save(cotisationDue);
        cotisationsDues.push(this.formatResponse(cotisationDue));
      }
    }

    return cotisationsDues;
  }

  /**
   * Récupérer toutes les cotisations dues avec filtres
   */
  async findAll(filters?: DueFiltersDto): Promise<CotisationDueResponseDto[]> {
    const queryBuilder = this.cotisationDueRepository
      .createQueryBuilder('cotisation')
      .leftJoinAndSelect('cotisation.reunion', 'reunion')
      .leftJoinAndSelect('cotisation.exerciceMembre', 'exerciceMembre')
      .leftJoinAndSelect('exerciceMembre.membre', 'membre');

    if (filters?.reunionId) {
      queryBuilder.andWhere('cotisation.reunionId = :reunionId', {
        reunionId: filters.reunionId
      });
    }

    if (filters?.exerciceMembreId) {
      queryBuilder.andWhere('cotisation.exerciceMembreId = :exerciceMembreId', {
        exerciceMembreId: filters.exerciceMembreId
      });
    }

    if (filters?.statut) {
      queryBuilder.andWhere('cotisation.statut = :statut', {
        statut: filters.statut
      });
    }

    queryBuilder.orderBy('cotisation.creeLe', 'DESC');

    const cotisations = await queryBuilder.getMany();
    return cotisations.map((c: CotisationDueMensuelle) => this.formatResponse(c));
  }

  /**
   * Récupérer une cotisation due par ID
   */
  async findById(id: string): Promise<CotisationDueResponseDto> {
    const cotisationDue = await this.cotisationDueRepository.findOne({
      where: { id },
      relations: ['reunion', 'exerciceMembre', 'exerciceMembre.membre']
    });

    if (!cotisationDue) {
      throw new NotFoundError('Cotisation due non trouvée');
    }

    return this.formatResponse(cotisationDue);
  }

  /**
   * Récupérer les cotisations dues d'une réunion
   */
  async findByReunion(reunionId: string): Promise<CotisationDueResponseDto[]> {
    const cotisations = await this.cotisationDueRepository.find({
      where: { reunionId },
      relations: ['reunion', 'exerciceMembre', 'exerciceMembre.membre'],
      order: { creeLe: 'ASC' }
    });
    return cotisations.map((c: CotisationDueMensuelle) => this.formatResponse(c));
  }

  /**
   * Enregistrer un paiement de cotisation (alias)
   */
  async enregistrerPaiement(id: string, data: UpdateDuePaymentDto): Promise<CotisationDueResponseDto> {
    return this.payer(id, data);
  }

  /**
   * Enregistrer un paiement de cotisation
   */
  async payer(id: string, data: UpdateDuePaymentDto): Promise<CotisationDueResponseDto> {
    const cotisationDue = await this.cotisationDueRepository.findOne({
      where: { id }
    });

    if (!cotisationDue) {
      throw new NotFoundError('Cotisation due non trouvée');
    }

    if (data.montantPaye <= 0) {
      throw new BadRequestError('Le montant doit être positif');
    }

    cotisationDue.montantPaye = Number(cotisationDue.montantPaye) + data.montantPaye;
    cotisationDue.soldeRestant = Number(cotisationDue.montantDu) - cotisationDue.montantPaye;

    // Mise à jour du statut
    if (cotisationDue.soldeRestant <= 0) {
      cotisationDue.statut = cotisationDue.soldeRestant < 0 ? StatutDu.SURPAYE : StatutDu.A_JOUR;
      cotisationDue.soldeRestant = Math.max(0, cotisationDue.soldeRestant);
    }

    await this.cotisationDueRepository.save(cotisationDue);
    return this.findById(id);
  }

  /**
   * Statistiques des cotisations d'une réunion (alias)
   */
  async getStatsByReunion(reunionId: string): Promise<{
    total: number;
    totalMontantDu: number;
    totalMontantPaye: number;
    tauxRecouvrement: number;
    aJour: number;
    enRetard: number;
  }> {
    return this.getReunionStats(reunionId);
  }

  /**
   * Statistiques des cotisations d'une réunion
   */
  async getReunionStats(reunionId: string): Promise<{
    total: number;
    totalMontantDu: number;
    totalMontantPaye: number;
    tauxRecouvrement: number;
    aJour: number;
    enRetard: number;
  }> {
    const cotisations = await this.cotisationDueRepository.find({
      where: { reunionId }
    });

    const stats = {
      total: cotisations.length,
      totalMontantDu: 0,
      totalMontantPaye: 0,
      tauxRecouvrement: 0,
      aJour: 0,
      enRetard: 0
    };

    cotisations.forEach((c: CotisationDueMensuelle) => {
      stats.totalMontantDu += Number(c.montantDu);
      stats.totalMontantPaye += Number(c.montantPaye);
      if (c.statut === StatutDu.A_JOUR || c.statut === StatutDu.SURPAYE) {
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

  private formatResponse(cotisationDue: CotisationDueMensuelle): CotisationDueResponseDto {
    return {
      id: cotisationDue.id,
      reunionId: cotisationDue.reunionId,
      exerciceMembreId: cotisationDue.exerciceMembreId,
      montantDu: Number(cotisationDue.montantDu),
      montantPaye: Number(cotisationDue.montantPaye),
      soldeRestant: Number(cotisationDue.soldeRestant),
      statut: cotisationDue.statut,
      creeLe: cotisationDue.creeLe
    };
  }
}

export const cotisationDueService = new CotisationDueService();
