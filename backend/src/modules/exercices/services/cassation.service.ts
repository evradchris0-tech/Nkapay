/**
 * Service pour la gestion des CASSATIONS
 *
 * LOGIQUE MÉTIER:
 * - La CASSATION survient à la clôture d'un exercice
 * - Chaque membre récupère SON ÉPARGNE accumulée pendant l'exercice
 * - Les déductions (prêts non remboursés, pénalités impayées) sont soustraites
 * - Le montant net est distribué au membre
 *
 * CALCUL:
 *   Montant Brut = Σ épargne payée sur toutes les réunions
 *   Déductions = prêts non remboursés + pénalités impayées
 *   Montant Net = Montant Brut - Déductions
 */

import { Repository } from 'typeorm';
import { AppDataSource } from '../../../config';
import { NotFoundError, BadRequestError } from '../../../shared';
import { Cassation, StatutCassation } from '../entities/cassation.entity';
import { Exercice, StatutExercice } from '../entities/exercice.entity';
import { ExerciceMembre, StatutExerciceMembre } from '../entities/exercice-membre.entity';
import { epargneDueService } from '../../transactions/services/epargne-due.service';
import { Pret, StatutPret } from '../../prets/entities/pret.entity';
import { RemboursementPret } from '../../prets/entities/remboursement-pret.entity';
import { Penalite } from '../../penalites/entities/penalite.entity';
import { regleExerciceService } from './regle-exercice.service';

/** DTO de réponse pour les cassations */
export interface CassationResponseDto {
  id: string;
  exerciceId: string;
  exerciceMembreId: string;
  exerciceMembre?: {
    id: string;
    utilisateurId: string;
    utilisateurNom?: string;
  };
  nombreParts: number;
  montantBrut: number;
  partBenefice: number;
  deductions: number;
  detailDeductions: Record<string, number> | null;
  montantNet: number;
  statut: StatutCassation;
  transactionId: string | null;
  creeLe: Date;
  distribueeLe: Date | null;
  commentaire: string | null;
}

/** DTO pour le résumé de cassation */
export interface CassationSummaryDto {
  totalMembres: number;
  totalMontantBrut: number;
  totalPartBenefice: number;
  totalDeductions: number;
  totalMontantNet: number;
  cassationsCalculees: number;
  cassationsDistribuees: number;
  cassationsAnnulees: number;
}

export class CassationService {
  private _cassationRepo?: Repository<Cassation>;
  private _exerciceRepo?: Repository<Exercice>;
  private _exerciceMembreRepo?: Repository<ExerciceMembre>;
  private _pretRepo?: Repository<Pret>;
  private _penaliteRepo?: Repository<Penalite>;

  private get cassationRepository(): Repository<Cassation> {
    if (!this._cassationRepo) this._cassationRepo = AppDataSource.getRepository(Cassation);
    return this._cassationRepo;
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

  private get pretRepository(): Repository<Pret> {
    if (!this._pretRepo) this._pretRepo = AppDataSource.getRepository(Pret);
    return this._pretRepo;
  }

  private get penaliteRepository(): Repository<Penalite> {
    if (!this._penaliteRepo) this._penaliteRepo = AppDataSource.getRepository(Penalite);
    return this._penaliteRepo;
  }

  /**
   * Calculer les cassations pour tous les membres d'un exercice
   * Cette opération prépare les montants mais ne distribue pas encore
   */
  async calculerPourExercice(exerciceId: string): Promise<CassationResponseDto[]> {
    const exercice = await this.exerciceRepository.findOne({
      where: { id: exerciceId },
    });

    if (!exercice) {
      throw new NotFoundError('Exercice non trouvé');
    }

    // Vérifier si des cassations existent déjà
    const existingCassations = await this.cassationRepository.find({
      where: { exerciceId },
    });
    if (existingCassations.length > 0) {
      throw new BadRequestError(
        'Les cassations ont déjà été calculées pour cet exercice. Supprimez-les avant de recalculer.'
      );
    }

    // Récupérer tous les membres actifs de l'exercice
    const membres = await this.exerciceMembreRepository.find({
      where: { exerciceId, statut: StatutExerciceMembre.ACTIF },
      relations: ['adhesionTontine', 'adhesionTontine.utilisateur'],
    });

    if (membres.length === 0) {
      return [];
    }

    // --- CALCUL DES DIVIDENDES (BÉNÉFICES) ---
    const modeRepartition = await regleExerciceService.getEffectiveValueByCle(exerciceId, 'REPARTITION_BENEFICES') || 'PRORATA';

    // Total intérêts payés
    const remboursements = await AppDataSource.getRepository(RemboursementPret)
      .createQueryBuilder('r')
      .innerJoin('r.pret', 'p')
      .innerJoin('p.exerciceMembre', 'em')
      .where('em.exercice_id = :exerciceId', { exerciceId })
      .getMany();
    const totalInterets = remboursements.reduce((sum, r) => sum + Number(r.montantInteret || 0), 0);

    // Total pénalités payées
    const penalitesPayees = await this.penaliteRepository
      .createQueryBuilder('p')
      .innerJoin('p.exerciceMembre', 'em')
      .where('em.exercice_id = :exerciceId', { exerciceId })
      .andWhere('p.statut = :statut', { statut: 'PAYEE' })
      .getMany();
    const totalPenalitesPayees = penalitesPayees.reduce((sum, p) => sum + Number(p.montant || 0), 0);

    const beneficeTotal = totalInterets + totalPenalitesPayees;

    // --- CALCUL PRÉLIMINAIRE DES ÉPARGNES ---
    let totalEpargneExercice = 0;
    const memoEpargneMembres = new Map<string, number>();

    for (const membre of membres) {
      const epargneTotale = await epargneDueService.getEpargneTotaleMembre(membre.id);
      memoEpargneMembres.set(membre.id, epargneTotale);
      totalEpargneExercice += epargneTotale;
    }

    const cassations: CassationResponseDto[] = [];

    for (const membre of membres) {
      // 1. Récupérer l'épargne (déjà calculée)
      const epargneTotale = memoEpargneMembres.get(membre.id) || 0;

      // 1b. Calcul de la part des bénéfices selon la règle
      let partBenefice = 0;
      if (beneficeTotal > 0) {
        if (modeRepartition === 'EGALITAIRE') {
          partBenefice = beneficeTotal / membres.length;
        } else {
          // PRORATA par défaut
          partBenefice = totalEpargneExercice > 0
            ? (epargneTotale / totalEpargneExercice) * beneficeTotal
            : 0;
        }
      }

      // 2. Calculer les déductions
      const detailDeductions: Record<string, number> = {};
      let totalDeductions = 0;

      // ... (suite déductions)
      const pretsEnCours = await this.pretRepository.find({
        where: { exerciceMembreId: membre.id, statut: StatutPret.EN_COURS },
      });
      const pretsDefaut = await this.pretRepository.find({
        where: { exerciceMembreId: membre.id, statut: StatutPret.DEFAUT },
      });

      const capitalRestantPrets = [...pretsEnCours, ...pretsDefaut].reduce(
        (sum, p) => sum + Number(p.capitalRestant),
        0
      );
      if (capitalRestantPrets > 0) {
        detailDeductions['prets_non_rembourses'] = capitalRestantPrets;
        totalDeductions += capitalRestantPrets;
      }

      const penalitesImpayees = await this.penaliteRepository
        .createQueryBuilder('p')
        .where('p.exerciceMembreId = :membreId', { membreId: membre.id })
        .andWhere('p.statut = :statut', { statut: 'EN_ATTENTE' })
        .getMany();

      const totalPenalites = penalitesImpayees.reduce((sum, p) => sum + Number(p.montant), 0);
      if (totalPenalites > 0) {
        detailDeductions['penalites_impayees'] = totalPenalites;
        totalDeductions += totalPenalites;
      }

      // 3. Montant net = Epargne + Part des bénéfices - Déductions
      const montantNet = Math.max(0, epargneTotale + partBenefice - totalDeductions);

      // 4. Créer l'enregistrement de cassation
      const cassation = this.cassationRepository.create({
        exerciceId,
        exerciceMembreId: membre.id,
        nombreParts: membre.nombreParts || 1,
        montantBrut: epargneTotale,
        partBenefice,
        deductions: totalDeductions,
        detailDeductions: Object.keys(detailDeductions).length > 0 ? detailDeductions : null,
        montantNet,
        statut: StatutCassation.CALCULEE,
      });

      await this.cassationRepository.save(cassation);
      cassations.push(this.formatResponse(cassation, membre));
    }

    return cassations;
  }

  /**
   * Distribuer une cassation individuelle (marquer comme distribuée)
   */
  async distribuer(id: string, transactionId?: string): Promise<CassationResponseDto> {
    const cassation = await this.cassationRepository.findOne({
      where: { id },
      relations: [
        'exerciceMembre',
        'exerciceMembre.adhesionTontine',
        'exerciceMembre.adhesionTontine.utilisateur',
      ],
    });

    if (!cassation) {
      throw new NotFoundError('Cassation non trouvée');
    }

    if (cassation.statut !== StatutCassation.CALCULEE) {
      throw new BadRequestError('Seule une cassation calculée peut être distribuée');
    }

    cassation.statut = StatutCassation.DISTRIBUEE;
    cassation.distribueeLe = new Date();
    if (transactionId) {
      cassation.transactionId = transactionId;
    }

    await this.cassationRepository.save(cassation);
    return this.formatResponse(cassation, cassation.exerciceMembre);
  }

  /**
   * Distribuer toutes les cassations calculées d'un exercice
   */
  async distribuerTout(exerciceId: string): Promise<CassationResponseDto[]> {
    const cassations = await this.cassationRepository.find({
      where: { exerciceId, statut: StatutCassation.CALCULEE },
      relations: [
        'exerciceMembre',
        'exerciceMembre.adhesionTontine',
        'exerciceMembre.adhesionTontine.utilisateur',
      ],
    });

    const resultats: CassationResponseDto[] = [];

    for (const cassation of cassations) {
      cassation.statut = StatutCassation.DISTRIBUEE;
      cassation.distribueeLe = new Date();
      await this.cassationRepository.save(cassation);
      resultats.push(this.formatResponse(cassation, cassation.exerciceMembre));
    }

    return resultats;
  }

  /**
   * Annuler une cassation
   */
  async annuler(id: string): Promise<CassationResponseDto> {
    const cassation = await this.cassationRepository.findOne({
      where: { id },
      relations: [
        'exerciceMembre',
        'exerciceMembre.adhesionTontine',
        'exerciceMembre.adhesionTontine.utilisateur',
      ],
    });

    if (!cassation) {
      throw new NotFoundError('Cassation non trouvée');
    }

    if (cassation.statut === StatutCassation.DISTRIBUEE) {
      throw new BadRequestError('Une cassation distribuée ne peut pas être annulée');
    }

    cassation.statut = StatutCassation.ANNULEE;
    await this.cassationRepository.save(cassation);
    return this.formatResponse(cassation, cassation.exerciceMembre);
  }

  /**
   * Récupérer les cassations d'un exercice
   */
  async findByExercice(exerciceId: string): Promise<CassationResponseDto[]> {
    const cassations = await this.cassationRepository.find({
      where: { exerciceId },
      relations: [
        'exerciceMembre',
        'exerciceMembre.adhesionTontine',
        'exerciceMembre.adhesionTontine.utilisateur',
      ],
      order: { creeLe: 'ASC' },
    });
    return cassations.map((c) => this.formatResponse(c, c.exerciceMembre));
  }

  /**
   * Récupérer une cassation par ID
   */
  async findById(id: string): Promise<CassationResponseDto> {
    const cassation = await this.cassationRepository.findOne({
      where: { id },
      relations: [
        'exerciceMembre',
        'exerciceMembre.adhesionTontine',
        'exerciceMembre.adhesionTontine.utilisateur',
      ],
    });

    if (!cassation) {
      throw new NotFoundError('Cassation non trouvée');
    }

    return this.formatResponse(cassation, cassation.exerciceMembre);
  }

  /**
   * Résumé des cassations d'un exercice
   */
  async getSummary(exerciceId: string): Promise<CassationSummaryDto> {
    const cassations = await this.cassationRepository.find({
      where: { exerciceId },
    });

    const summary: CassationSummaryDto = {
      totalMembres: cassations.length,
      totalMontantBrut: 0,
      totalPartBenefice: 0,
      totalDeductions: 0,
      totalMontantNet: 0,
      cassationsCalculees: 0,
      cassationsDistribuees: 0,
      cassationsAnnulees: 0,
    };

    cassations.forEach((c) => {
      summary.totalMontantBrut += Number(c.montantBrut || 0);
      summary.totalPartBenefice += Number(c.partBenefice || 0);
      summary.totalDeductions += Number(c.deductions || 0);
      summary.totalMontantNet += Number(c.montantNet || 0);

      if (c.statut === StatutCassation.CALCULEE) summary.cassationsCalculees++;
      else if (c.statut === StatutCassation.DISTRIBUEE) summary.cassationsDistribuees++;
      else if (c.statut === StatutCassation.ANNULEE) summary.cassationsAnnulees++;
    });

    return summary;
  }

  /**
   * Supprimer toutes les cassations d'un exercice (pour recalcul)
   */
  async resetExercice(exerciceId: string): Promise<void> {
    const cassations = await this.cassationRepository.find({
      where: { exerciceId },
    });

    const distributed = cassations.filter((c) => c.statut === StatutCassation.DISTRIBUEE);
    if (distributed.length > 0) {
      throw new BadRequestError(
        'Impossible de réinitialiser: des cassations ont déjà été distribuées'
      );
    }

    await this.cassationRepository.remove(cassations);
  }

  private formatResponse(cassation: Cassation, membre?: ExerciceMembre): CassationResponseDto {
    const utilisateur = membre?.adhesionTontine?.utilisateur;

    return {
      id: cassation.id,
      exerciceId: cassation.exerciceId,
      exerciceMembreId: cassation.exerciceMembreId,
      exerciceMembre: membre
        ? {
          id: membre.id,
          utilisateurId: utilisateur?.id || '',
          utilisateurNom: utilisateur ? `${utilisateur.prenom} ${utilisateur.nom}` : undefined,
        }
        : undefined,
      nombreParts: cassation.nombreParts,
      montantBrut: Number(cassation.montantBrut || 0),
      partBenefice: Number(cassation.partBenefice || 0),
      deductions: Number(cassation.deductions || 0),
      detailDeductions: cassation.detailDeductions,
      montantNet: Number(cassation.montantNet || 0),
      statut: cassation.statut,
      transactionId: cassation.transactionId,
      creeLe: cassation.creeLe,
      distribueeLe: cassation.distribueeLe,
      commentaire: cassation.commentaire,
    };
  }
}

export const cassationService = new CassationService();
