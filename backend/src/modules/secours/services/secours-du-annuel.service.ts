/**
 * Service pour la gestion des secours dus annuels
 */

import { Repository } from 'typeorm';
import { AppDataSource } from '../../../config';
import { NotFoundError, BadRequestError } from '../../../shared';
import { SecoursDuAnnuel } from '../entities/secours-du-annuel.entity';
import { StatutDu } from '../../transactions/entities/inscription-due-exercice.entity';
import { Exercice } from '../../exercices/entities/exercice.entity';
import { ExerciceMembre } from '../../exercices/entities/exercice-membre.entity';
import { SecoursDuAnnuelResponseDto, SecoursDuFiltersDto } from '../dto/bilan-secours.dto';
import { UpdateDuePaymentDto } from '../../transactions/dto/dues.dto';

export class SecoursDuAnnuelService {
  private _secoursDuRepo?: Repository<SecoursDuAnnuel>;
  private _exerciceRepo?: Repository<Exercice>;
  private _exerciceMembreRepo?: Repository<ExerciceMembre>;

  private get secoursDuRepository(): Repository<SecoursDuAnnuel> {
    if (!this._secoursDuRepo) this._secoursDuRepo = AppDataSource.getRepository(SecoursDuAnnuel);
    return this._secoursDuRepo;
  }

  private get exerciceRepository(): Repository<Exercice> {
    if (!this._exerciceRepo) this._exerciceRepo = AppDataSource.getRepository(Exercice);
    return this._exerciceRepo;
  }

  private get exerciceMembreRepository(): Repository<ExerciceMembre> {
    if (!this._exerciceMembreRepo)
      this._exerciceMembreRepo = AppDataSource.getRepository(ExerciceMembre);
    return this._exerciceMembreRepo;
  }

  /**
   * Générer les secours dus pour tous les membres d'un exercice
   */
  async genererPourExercice(
    exerciceId: string,
    montantDu: number
  ): Promise<SecoursDuAnnuelResponseDto[]> {
    const exercice = await this.exerciceRepository.findOne({
      where: { id: exerciceId },
      relations: ['membres'],
    });

    if (!exercice) {
      throw new NotFoundError('Exercice non trouvé');
    }

    const secoursDus: SecoursDuAnnuelResponseDto[] = [];

    for (const exerciceMembre of exercice.membres) {
      const existing = await this.secoursDuRepository.findOne({
        where: { exerciceMembreId: exerciceMembre.id },
      });

      if (!existing) {
        const secoursDu = this.secoursDuRepository.create({
          exerciceMembreId: exerciceMembre.id,
          montantDu,
          montantPaye: 0,
          soldeRestant: montantDu,
          statut: StatutDu.EN_RETARD,
        });
        await this.secoursDuRepository.save(secoursDu);
        secoursDus.push(this.formatResponse(secoursDu));
      }
    }

    return secoursDus;
  }

  /**
   * Récupérer tous les secours dus avec filtres
   */
  async findAll(filters?: SecoursDuFiltersDto): Promise<SecoursDuAnnuelResponseDto[]> {
    const queryBuilder = this.secoursDuRepository
      .createQueryBuilder('secoursDu')
      .leftJoinAndSelect('secoursDu.exerciceMembre', 'exerciceMembre')
      .leftJoinAndSelect('exerciceMembre.adhesionTontine', 'adhesionTontine')
      .leftJoinAndSelect('exerciceMembre.exercice', 'exercice');

    if (filters?.exerciceMembreId) {
      queryBuilder.andWhere('secoursDu.exerciceMembreId = :exerciceMembreId', {
        exerciceMembreId: filters.exerciceMembreId,
      });
    }

    if (filters?.statut) {
      queryBuilder.andWhere('secoursDu.statut = :statut', {
        statut: filters.statut,
      });
    }

    queryBuilder.orderBy('secoursDu.creeLe', 'DESC');

    const secoursDus = await queryBuilder.getMany();
    return secoursDus.map((s: SecoursDuAnnuel) => this.formatResponse(s));
  }

  /**
   * Récupérer un secours dû par ID
   */
  async findById(id: string): Promise<SecoursDuAnnuelResponseDto> {
    const secoursDu = await this.secoursDuRepository.findOne({
      where: { id },
      relations: ['exerciceMembre', 'exerciceMembre.adhesionTontine'],
    });

    if (!secoursDu) {
      throw new NotFoundError('Secours dû non trouvé');
    }

    return this.formatResponse(secoursDu);
  }

  /**
   * Récupérer les secours dus d'un exercice
   */
  async findByExercice(exerciceId: string): Promise<SecoursDuAnnuelResponseDto[]> {
    const secoursDus = await this.secoursDuRepository
      .createQueryBuilder('secoursDu')
      .leftJoinAndSelect('secoursDu.exerciceMembre', 'exerciceMembre')
      .leftJoinAndSelect('exerciceMembre.adhesionTontine', 'adhesionTontine')
      .where('exerciceMembre.exerciceId = :exerciceId', { exerciceId })
      .orderBy('secoursDu.creeLe', 'ASC')
      .getMany();

    return secoursDus.map((s: SecoursDuAnnuel) => this.formatResponse(s));
  }

  /**
   * Récupérer les secours en retard
   */
  async findEnRetard(exerciceId?: string): Promise<SecoursDuAnnuelResponseDto[]> {
    const queryBuilder = this.secoursDuRepository
      .createQueryBuilder('secoursDu')
      .leftJoinAndSelect('secoursDu.exerciceMembre', 'exerciceMembre')
      .leftJoinAndSelect('exerciceMembre.adhesionTontine', 'adhesionTontine')
      .where('secoursDu.statut = :statut', { statut: StatutDu.EN_RETARD });

    if (exerciceId) {
      queryBuilder.andWhere('exerciceMembre.exerciceId = :exerciceId', { exerciceId });
    }

    queryBuilder.orderBy('secoursDu.creeLe', 'ASC');

    const secoursDus = await queryBuilder.getMany();
    return secoursDus.map((s: SecoursDuAnnuel) => this.formatResponse(s));
  }

  /**
   * Enregistrer un paiement de secours (alias)
   */
  async enregistrerPaiement(
    id: string,
    data: UpdateDuePaymentDto
  ): Promise<SecoursDuAnnuelResponseDto> {
    return this.payer(id, data);
  }

  /**
   * Enregistrer un paiement de secours
   */
  async payer(id: string, data: UpdateDuePaymentDto): Promise<SecoursDuAnnuelResponseDto> {
    const secoursDu = await this.secoursDuRepository.findOne({
      where: { id },
    });

    if (!secoursDu) {
      throw new NotFoundError('Secours dû non trouvé');
    }

    if (data.montantPaye <= 0) {
      throw new BadRequestError('Le montant doit être positif');
    }

    secoursDu.montantPaye = Number(secoursDu.montantPaye) + data.montantPaye;
    secoursDu.soldeRestant = Number(secoursDu.montantDu) - secoursDu.montantPaye;

    // Mise à jour du statut
    if (secoursDu.soldeRestant <= 0) {
      secoursDu.statut = secoursDu.soldeRestant < 0 ? StatutDu.SURPAYE : StatutDu.A_JOUR;
      secoursDu.soldeRestant = Math.max(0, secoursDu.soldeRestant);
    }

    await this.secoursDuRepository.save(secoursDu);
    return this.findById(id);
  }

  /**
   * Statistiques des secours dus d'un exercice (alias)
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
   * Statistiques des secours dus d'un exercice
   */
  async getExerciceStats(exerciceId: string): Promise<{
    total: number;
    totalMontantDu: number;
    totalMontantPaye: number;
    tauxRecouvrement: number;
    aJour: number;
    enRetard: number;
  }> {
    const secoursDus = await this.secoursDuRepository
      .createQueryBuilder('secoursDu')
      .leftJoin('secoursDu.exerciceMembre', 'exerciceMembre')
      .where('exerciceMembre.exerciceId = :exerciceId', { exerciceId })
      .getMany();

    const stats = {
      total: secoursDus.length,
      totalMontantDu: 0,
      totalMontantPaye: 0,
      tauxRecouvrement: 0,
      aJour: 0,
      enRetard: 0,
    };

    secoursDus.forEach((s: SecoursDuAnnuel) => {
      stats.totalMontantDu += Number(s.montantDu);
      stats.totalMontantPaye += Number(s.montantPaye);
      if (s.statut === StatutDu.A_JOUR || s.statut === StatutDu.SURPAYE) {
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

  private formatResponse(secoursDu: SecoursDuAnnuel): SecoursDuAnnuelResponseDto {
    return {
      id: secoursDu.id,
      exerciceMembreId: secoursDu.exerciceMembreId,
      montantDu: Number(secoursDu.montantDu),
      montantPaye: Number(secoursDu.montantPaye),
      soldeRestant: Number(secoursDu.soldeRestant),
      statut: secoursDu.statut,
      creeLe: secoursDu.creeLe,
    };
  }
}

export const secoursDuAnnuelService = new SecoursDuAnnuelService();
