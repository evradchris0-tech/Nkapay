/**
 * Service pour la gestion des pots dus mensuels
 */

import { Repository } from 'typeorm';
import { AppDataSource } from '../../../config';
import { NotFoundError, BadRequestError } from '../../../shared';
import { PotDuMensuel } from '../entities/pot-du-mensuel.entity';
import { StatutDu } from '../entities/inscription-due-exercice.entity';
import { Reunion } from '../../reunions/entities/reunion.entity';
import { ExerciceMembre } from '../../exercices/entities/exercice-membre.entity';
import { PotDuMensuelResponseDto, DueFiltersDto, UpdateDuePaymentDto } from '../dto/dues.dto';

export class PotDuService {
  private _potDuRepo?: Repository<PotDuMensuel>;
  private _reunionRepo?: Repository<Reunion>;
  private _exerciceMembreRepo?: Repository<ExerciceMembre>;

  private get potDuRepository(): Repository<PotDuMensuel> {
    if (!this._potDuRepo) this._potDuRepo = AppDataSource.getRepository(PotDuMensuel);
    return this._potDuRepo;
  }

  private get reunionRepository(): Repository<Reunion> {
    if (!this._reunionRepo) this._reunionRepo = AppDataSource.getRepository(Reunion);
    return this._reunionRepo;
  }

  private get exerciceMembreRepository(): Repository<ExerciceMembre> {
    if (!this._exerciceMembreRepo)
      this._exerciceMembreRepo = AppDataSource.getRepository(ExerciceMembre);
    return this._exerciceMembreRepo;
  }

  /**
   * Générer les pots dus pour une réunion
   */
  async genererPourReunion(
    reunionId: string,
    montantDu: number
  ): Promise<PotDuMensuelResponseDto[]> {
    const reunion = await this.reunionRepository.findOne({
      where: { id: reunionId },
      relations: ['exercice', 'exercice.membres'],
    });

    if (!reunion) {
      throw new NotFoundError('Réunion non trouvée');
    }

    const potsDus: PotDuMensuelResponseDto[] = [];

    for (const exerciceMembre of reunion.exercice.membres) {
      const existing = await this.potDuRepository.findOne({
        where: {
          reunionId,
          exerciceMembreId: exerciceMembre.id,
        },
      });

      if (!existing) {
        const potDu = this.potDuRepository.create({
          reunionId,
          exerciceMembreId: exerciceMembre.id,
          montantDu,
          montantPaye: 0,
          soldeRestant: montantDu,
          statut: StatutDu.EN_RETARD,
        });
        await this.potDuRepository.save(potDu);
        potsDus.push(this.formatResponse(potDu));
      }
    }

    return potsDus;
  }

  /**
   * Récupérer les pots dus d'une réunion
   */
  async findByReunion(reunionId: string): Promise<PotDuMensuelResponseDto[]> {
    const pots = await this.potDuRepository.find({
      where: { reunionId },
      relations: ['reunion', 'exerciceMembre', 'exerciceMembre.adhesionTontine'],
      order: { creeLe: 'ASC' },
    });
    return pots.map((p: PotDuMensuel) => this.formatResponse(p));
  }

  /**
   * Enregistrer un paiement de pot
   */
  async enregistrerPaiement(
    id: string,
    data: UpdateDuePaymentDto
  ): Promise<PotDuMensuelResponseDto> {
    const potDu = await this.potDuRepository.findOne({
      where: { id },
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
    return this.formatResponse(potDu);
  }

  /**
   * Statistiques des pots d'une réunion
   */
  async getStatsByReunion(reunionId: string): Promise<{
    total: number;
    totalMontantDu: number;
    totalMontantPaye: number;
    tauxRecouvrement: number;
    aJour: number;
    enRetard: number;
  }> {
    const pots = await this.potDuRepository.find({
      where: { reunionId },
    });

    const stats = {
      total: pots.length,
      totalMontantDu: 0,
      totalMontantPaye: 0,
      tauxRecouvrement: 0,
      aJour: 0,
      enRetard: 0,
    };

    pots.forEach((p: PotDuMensuel) => {
      stats.totalMontantDu += Number(p.montantDu);
      stats.totalMontantPaye += Number(p.montantPaye);
      if (p.statut === StatutDu.A_JOUR || p.statut === StatutDu.SURPAYE) {
        stats.aJour++;
      } else {
        stats.enRetard++;
      }
    });

    if (stats.totalMontantDu > 0) {
      stats.tauxRecouvrement =
        Math.round((stats.totalMontantPaye / stats.totalMontantDu) * 10000) / 100;
    }

    return stats;
  }

  /**
   * Pot total collecté pour une réunion
   */
  async getPotTotalReunion(reunionId: string): Promise<number> {
    const result = await this.potDuRepository
      .createQueryBuilder('pot')
      .select('SUM(pot.montantPaye)', 'total')
      .where('pot.reunionId = :reunionId', { reunionId })
      .getRawOne();

    return Number(result?.total) || 0;
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
      creeLe: potDu.creeLe,
    };
  }
}

export const potDuService = new PotDuService();
