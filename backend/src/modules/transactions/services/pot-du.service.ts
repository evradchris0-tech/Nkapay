/**
 * Service pour la gestion des pots dus mensuels
 */

import { AppDataSource } from '../../../config';
import { NotFoundError, BadRequestError } from '../../../shared';
import { PotDuMensuel } from '../entities/pot-du-mensuel.entity';
import { StatutDu } from '../entities/inscription-due-exercice.entity';
import { Reunion } from '../../reunions/entities/reunion.entity';
import { ExerciceMembre } from '../../exercices/entities/exercice-membre.entity';
import {
  PotDuMensuelResponseDto,
  DueFiltersDto,
  UpdateDuePaymentDto
} from '../dto/dues.dto';

export class PotDuService {
  private potDuRepository = AppDataSource.getRepository(PotDuMensuel);
  private reunionRepository = AppDataSource.getRepository(Reunion);
  private exerciceMembreRepository = AppDataSource.getRepository(ExerciceMembre);

  /**
   * Générer les pots dus pour une réunion
   */
  async genererPourReunion(reunionId: string, montantDu: number): Promise<PotDuMensuelResponseDto[]> {
    const reunion = await this.reunionRepository.findOne({
      where: { id: reunionId },
      relations: ['exercice', 'exercice.membres']
    });

    if (!reunion) {
      throw new NotFoundError('Réunion non trouvée');
    }

    const potsDus: PotDuMensuelResponseDto[] = [];

    for (const exerciceMembre of reunion.exercice.membres) {
      const existing = await this.potDuRepository.findOne({
        where: {
          reunionId,
          exerciceMembreId: exerciceMembre.id
        }
      });

      if (!existing) {
        const potDu = this.potDuRepository.create({
          reunionId,
          exerciceMembreId: exerciceMembre.id,
          montantDu,
          montantPaye: 0,
          soldeRestant: montantDu,
          statut: StatutDu.EN_RETARD
        });
        await this.potDuRepository.save(potDu);
        potsDus.push(this.formatResponse(potDu));
      }
    }

    return potsDus;
  }

  /**
   * Récupérer tous les pots dus avec filtres
   */
  async findAll(filters?: DueFiltersDto): Promise<PotDuMensuelResponseDto[]> {
    const queryBuilder = this.potDuRepository
      .createQueryBuilder('potDu')
      .leftJoinAndSelect('potDu.reunion', 'reunion')
      .leftJoinAndSelect('potDu.exerciceMembre', 'exerciceMembre')
      .leftJoinAndSelect('exerciceMembre.membre', 'membre');

    if (filters?.reunionId) {
      queryBuilder.andWhere('potDu.reunionId = :reunionId', {
        reunionId: filters.reunionId
      });
    }

    if (filters?.exerciceMembreId) {
      queryBuilder.andWhere('potDu.exerciceMembreId = :exerciceMembreId', {
        exerciceMembreId: filters.exerciceMembreId
      });
    }

    if (filters?.statut) {
      queryBuilder.andWhere('potDu.statut = :statut', {
        statut: filters.statut
      });
    }

    queryBuilder.orderBy('potDu.creeLe', 'DESC');

    const potsDus = await queryBuilder.getMany();
    return potsDus.map((p: PotDuMensuel) => this.formatResponse(p));
  }

  /**
   * Récupérer un pot dû par ID
   */
  async findById(id: string): Promise<PotDuMensuelResponseDto> {
    const potDu = await this.potDuRepository.findOne({
      where: { id },
      relations: ['reunion', 'exerciceMembre', 'exerciceMembre.membre']
    });

    if (!potDu) {
      throw new NotFoundError('Pot dû non trouvé');
    }

    return this.formatResponse(potDu);
  }

  /**
   * Récupérer les pots dus d'une réunion
   */
  async findByReunion(reunionId: string): Promise<PotDuMensuelResponseDto[]> {
    const potsDus = await this.potDuRepository.find({
      where: { reunionId },
      relations: ['reunion', 'exerciceMembre', 'exerciceMembre.membre'],
      order: { creeLe: 'ASC' }
    });
    return potsDus.map((p: PotDuMensuel) => this.formatResponse(p));
  }

  /**
   * Enregistrer un paiement de pot (alias)
   */
  async enregistrerPaiement(id: string, data: UpdateDuePaymentDto): Promise<PotDuMensuelResponseDto> {
    return this.payer(id, data);
  }

  /**
   * Enregistrer un paiement de pot
   */
  async payer(id: string, data: UpdateDuePaymentDto): Promise<PotDuMensuelResponseDto> {
    const potDu = await this.potDuRepository.findOne({
      where: { id }
    });

    if (!potDu) {
      throw new NotFoundError('Pot dû non trouvé');
    }

    if (data.montantPaye <= 0) {
      throw new BadRequestError('Le montant doit être positif');
    }

    potDu.montantPaye = Number(potDu.montantPaye) + data.montantPaye;
    potDu.soldeRestant = Number(potDu.montantDu) - potDu.montantPaye;

    // Mise à jour du statut
    if (potDu.soldeRestant <= 0) {
      potDu.statut = potDu.soldeRestant < 0 ? StatutDu.SURPAYE : StatutDu.A_JOUR;
      potDu.soldeRestant = Math.max(0, potDu.soldeRestant);
    }

    await this.potDuRepository.save(potDu);
    return this.findById(id);
  }

  /**
   * Statistiques des pots d'une réunion (alias)
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
   * Calculer le total des pots d'une réunion (alias)
   */
  async getPotTotalReunion(reunionId: string): Promise<{
    totalDu: number;
    totalPaye: number;
    totalRestant: number;
  }> {
    return this.getTotal(reunionId);
  }

  /**
   * Calculer le total des pots d'une réunion
   */
  async getTotal(reunionId: string): Promise<{
    totalDu: number;
    totalPaye: number;
    totalRestant: number;
  }> {
    const potsDus = await this.potDuRepository.find({
      where: { reunionId }
    });

    let totalDu = 0;
    let totalPaye = 0;

    potsDus.forEach((p: PotDuMensuel) => {
      totalDu += Number(p.montantDu);
      totalPaye += Number(p.montantPaye);
    });

    return {
      totalDu,
      totalPaye,
      totalRestant: totalDu - totalPaye
    };
  }

  /**
   * Statistiques des pots d'une réunion
   */
  async getReunionStats(reunionId: string): Promise<{
    total: number;
    totalMontantDu: number;
    totalMontantPaye: number;
    tauxRecouvrement: number;
    aJour: number;
    enRetard: number;
  }> {
    const potsDus = await this.potDuRepository.find({
      where: { reunionId }
    });

    const stats = {
      total: potsDus.length,
      totalMontantDu: 0,
      totalMontantPaye: 0,
      tauxRecouvrement: 0,
      aJour: 0,
      enRetard: 0
    };

    potsDus.forEach((p: PotDuMensuel) => {
      stats.totalMontantDu += Number(p.montantDu);
      stats.totalMontantPaye += Number(p.montantPaye);
      if (p.statut === StatutDu.A_JOUR || p.statut === StatutDu.SURPAYE) {
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

  private formatResponse(potDu: PotDuMensuel): PotDuMensuelResponseDto {
    return {
      id: potDu.id,
      reunionId: potDu.reunionId,
      exerciceMembreId: potDu.exerciceMembreId,
      montantDu: Number(potDu.montantDu),
      montantPaye: Number(potDu.montantPaye),
      soldeRestant: Number(potDu.soldeRestant),
      statut: potDu.statut,
      creeLe: potDu.creeLe
    };
  }
}

export const potDuService = new PotDuService();
