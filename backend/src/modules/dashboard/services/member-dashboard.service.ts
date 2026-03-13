/**
 * Service pour le Dashboard Membre
 * Aggrège les données financières et opérationnelles pour un membre spécifique
 *
 * Bonnes pratiques appliquées:
 * - Repositories lazy (getter) pour éviter les crashs au démarrage
 * - Agrégation SQL (SUM, COUNT) au lieu d'itérations JS
 * - Méthodes privées pour chaque domaine (dettes, prêts, bénéficiaire)
 */

import { Repository } from 'typeorm';
import { AppDataSource } from '../../../config';
import { NotFoundError } from '../../../shared';
import { ExerciceMembre } from '../../exercices/entities/exercice-membre.entity';
import {
  Transaction,
  TypeTransaction,
  StatutTransaction,
} from '../../transactions/entities/transaction.entity';
import { Pret, StatutPret } from '../../prets/entities/pret.entity';
import { RemboursementPret } from '../../prets/entities/remboursement-pret.entity';
import { Reunion } from '../../reunions/entities/reunion.entity';
import { CotisationDueMensuelle } from '../../transactions/entities/cotisation-due-mensuelle.entity';
import { InscriptionDueExercice } from '../../transactions/entities/inscription-due-exercice.entity';
import { Penalite, StatutPenalite } from '../../penalites/entities/penalite.entity';
import { Distribution, StatutDistribution } from '../../distributions/entities/distribution.entity';
import { MemberDashboardResponseDto } from '../dto/member-dashboard.dto';

// =============================================================================
// Types internes
// =============================================================================

interface DettesDetail {
  cotisationsRetard: number;
  amendesImpayees: number;
  inscriptionImpayee: number;
  total: number;
}

interface EcheancierPretDetail {
  enCours: boolean;
  capitalRestant: number;
  interetsPayes: number;
  prochaineEcheance: string | null;
  montantProchaineEcheance: number;
}

interface BeneficiaireInfo {
  estBeneficiaire: boolean;
  ordreDistribution: number | null;
  montantAttendu: number;
}

// =============================================================================
// Service
// =============================================================================

export class MemberDashboardService {
  // Repositories lazy — initialisés au premier appel pour éviter les crashs
  private get emRepo(): Repository<ExerciceMembre> {
    return AppDataSource.getRepository(ExerciceMembre);
  }
  private get txRepo(): Repository<Transaction> {
    return AppDataSource.getRepository(Transaction);
  }
  private get pretRepo(): Repository<Pret> {
    return AppDataSource.getRepository(Pret);
  }
  private get remboursementRepo(): Repository<RemboursementPret> {
    return AppDataSource.getRepository(RemboursementPret);
  }
  private get reunionRepo(): Repository<Reunion> {
    return AppDataSource.getRepository(Reunion);
  }
  private get cotisationDueRepo(): Repository<CotisationDueMensuelle> {
    return AppDataSource.getRepository(CotisationDueMensuelle);
  }
  private get inscriptionDueRepo(): Repository<InscriptionDueExercice> {
    return AppDataSource.getRepository(InscriptionDueExercice);
  }
  private get penaliteRepo(): Repository<Penalite> {
    return AppDataSource.getRepository(Penalite);
  }
  private get distributionRepo(): Repository<Distribution> {
    return AppDataSource.getRepository(Distribution);
  }

  /**
   * Récupère les statistiques complètes pour un membre d'exercice
   */
  async getMemberStats(exerciceMembreId: string): Promise<MemberDashboardResponseDto> {
    // 1. Charger les infos membre (avec relations)
    const membre = await this.emRepo.findOne({
      where: { id: exerciceMembreId },
      relations: [
        'adhesionTontine',
        'adhesionTontine.utilisateur',
        'exercice',
        'exercice.tontine',
        'exercice.tontine.tontineType',
      ],
    });

    if (!membre) {
      throw new NotFoundError(`Membre d'exercice non trouvé: ${exerciceMembreId}`);
    }

    const tontine = membre.exercice.tontine;
    const exercice = membre.exercice;
    const utilisateur = membre.adhesionTontine.utilisateur;

    // 2. Toutes les agrégations en parallèle (performances)
    const [soldes, dettes, pretDetail, beneficiaireInfo, prochaineReunion, activiteRecente] =
      await Promise.all([
        this.calculerSoldes(exerciceMembreId),
        this.calculerDettes(exerciceMembreId),
        this.calculerEcheancierPret(exerciceMembreId),
        this.verifierBeneficiaire(exerciceMembreId, exercice.id),
        this.getProchaineReunion(exercice.id),
        this.getActiviteRecente(exerciceMembreId),
      ]);

    // 3. Construction des dates exercice
    const dateDebut = new Date(exercice.anneeDebut, exercice.moisDebut - 1, 1);
    const dateFin = new Date(exercice.anneeFin, exercice.moisFin - 1, 30);

    return {
      exerciceMembreId: membre.id,
      membre: {
        nomComplet: utilisateur ? `${utilisateur.prenom} ${utilisateur.nom}` : 'Membre Inconnu',
        role: membre.adhesionTontine.role,
        parts: membre.nombreParts,
        statut: membre.statut,
      },
      tontine: {
        id: tontine.id,
        nom: tontine.nom,
        type: tontine.tontineType?.libelle || 'Standard',
        devise: 'XAF',
      },
      exercice: {
        id: exercice.id,
        annee: exercice.anneeDebut,
        dateDebut: dateDebut.toISOString(),
        dateFin: dateFin.toISOString(),
        statut: exercice.statut,
      },
      solde: {
        totalCotise: soldes.totalCotise,
        totalDettes: dettes.total,
        totalEpargne: soldes.totalEpargne,
        totalSecoursPaye: soldes.totalSecoursPaye,
      },
      prochaineReunion: prochaineReunion
        ? {
            id: prochaineReunion.id,
            date:
              prochaineReunion.dateReunion instanceof Date
                ? prochaineReunion.dateReunion.toISOString()
                : String(prochaineReunion.dateReunion),
            lieu: prochaineReunion.lieu || '',
            montantAttendu: beneficiaireInfo.montantAttendu,
            estBeneficiaire: beneficiaireInfo.estBeneficiaire,
          }
        : null,
      prets: pretDetail,
      secours: null, // À enrichir avec EvenementSecours actifs
      activiteRecente,
    };
  }

  // ==========================================================================
  // MÉTHODES PRIVÉES — Agrégation SQL
  // ==========================================================================

  /**
   * Calcul des soldes par agrégation SQL (pas d'itération JS)
   */
  private async calculerSoldes(exerciceMembreId: string): Promise<{
    totalCotise: number;
    totalEpargne: number;
    totalSecoursPaye: number;
  }> {
    const result = await this.txRepo
      .createQueryBuilder('t')
      .select([
        `COALESCE(SUM(CASE WHEN t.typeTransaction = :cotisation THEN t.montant ELSE 0 END), 0) AS "totalCotise"`,
        `COALESCE(SUM(CASE WHEN t.typeTransaction = :epargne THEN t.montant ELSE 0 END), 0) AS "totalEpargne"`,
        `COALESCE(SUM(CASE WHEN t.typeTransaction = :secours THEN t.montant ELSE 0 END), 0) AS "totalSecoursPaye"`,
      ])
      .where('t.exerciceMembreId = :exerciceMembreId', { exerciceMembreId })
      .andWhere('t.statut = :statut', { statut: StatutTransaction.VALIDE })
      .setParameters({
        cotisation: TypeTransaction.COTISATION,
        epargne: TypeTransaction.EPARGNE,
        secours: TypeTransaction.SECOURS,
      })
      .getRawOne();

    return {
      totalCotise: Number(result?.totalCotise ?? 0),
      totalEpargne: Number(result?.totalEpargne ?? 0),
      totalSecoursPaye: Number(result?.totalSecoursPaye ?? 0),
    };
  }

  /**
   * Calcul des dettes réelles à partir de 3 sources
   */
  private async calculerDettes(exerciceMembreId: string): Promise<DettesDetail> {
    // 1. Cotisations en retard (solde restant > 0)
    const cotisationsRaw = await this.cotisationDueRepo
      .createQueryBuilder('c')
      .select('COALESCE(SUM(c.soldeRestant), 0)', 'total')
      .where('c.exerciceMembreId = :exerciceMembreId', { exerciceMembreId })
      .andWhere('c.soldeRestant > 0')
      .getRawOne<{ total: string }>();

    // 2. Amendes impayées (statut EN_ATTENTE)
    const amendesRaw = await this.penaliteRepo
      .createQueryBuilder('p')
      .select('COALESCE(SUM(p.montant), 0)', 'total')
      .where('p.exerciceMembreId = :exerciceMembreId', { exerciceMembreId })
      .andWhere('p.statut = :statut', { statut: StatutPenalite.EN_ATTENTE })
      .getRawOne<{ total: string }>();

    // 3. Inscription impayée
    const inscription = await this.inscriptionDueRepo.findOne({
      where: { exerciceMembreId },
    });

    const cotisationsRetard = Number(cotisationsRaw?.total ?? 0);
    const amendesImpayees = Number(amendesRaw?.total ?? 0);
    const inscriptionImpayee = inscription ? Number(inscription.soldeRestant) : 0;

    return {
      cotisationsRetard,
      amendesImpayees,
      inscriptionImpayee,
      total: cotisationsRetard + amendesImpayees + inscriptionImpayee,
    };
  }

  /**
   * Calcul de l'échéancier du prêt en cours
   */
  private async calculerEcheancierPret(
    exerciceMembreId: string
  ): Promise<EcheancierPretDetail | null> {
    const pretActif = await this.pretRepo.findOne({
      where: {
        exerciceMembreId,
        statut: StatutPret.EN_COURS,
      },
    });

    if (!pretActif) return null;

    // Récupérer les remboursements pour calculer les intérêts payés
    const remboursementsRaw = await this.remboursementRepo
      .createQueryBuilder('r')
      .select([
        'COALESCE(SUM(r.montantInteret), 0) AS "totalInterets"',
        'MAX(r.dateRemboursement) AS "dernierRemboursement"',
        'COUNT(r.id) AS "nbRemboursements"',
      ])
      .where('r.pretId = :pretId', { pretId: pretActif.id })
      .getRawOne();

    const totalInterets = Number(remboursementsRaw?.totalInterets ?? 0);
    const nbRemboursements = Number(remboursementsRaw?.nbRemboursements ?? 0);
    const dernierRemboursement = remboursementsRaw?.dernierRemboursement
      ? new Date(remboursementsRaw.dernierRemboursement)
      : null;

    // Calculer la prochaine échéance
    let prochaineEcheance: Date | null = null;
    if (dernierRemboursement) {
      prochaineEcheance = new Date(dernierRemboursement);
      prochaineEcheance.setMonth(prochaineEcheance.getMonth() + 1);
    } else if (pretActif.dateDecaissement) {
      prochaineEcheance = new Date(pretActif.dateDecaissement);
      prochaineEcheance.setMonth(prochaineEcheance.getMonth() + 1);
    }

    // Calculer le montant de la prochaine échéance
    const moisRestants = Math.max(pretActif.dureeMois - nbRemboursements, 1);
    const capitalRestant = Number(pretActif.capitalRestant);
    const montantCapitalMensuel = capitalRestant / moisRestants;
    const montantInteretMensuel = capitalRestant * Number(pretActif.tauxInteret);
    const montantProchaineEcheance =
      Math.round((montantCapitalMensuel + montantInteretMensuel) * 100) / 100;

    return {
      enCours: true,
      capitalRestant,
      interetsPayes: totalInterets,
      prochaineEcheance: prochaineEcheance ? prochaineEcheance.toISOString() : null,
      montantProchaineEcheance,
    };
  }

  /**
   * Vérifier si le membre est le prochain bénéficiaire ("tour de bouffe")
   */
  private async verifierBeneficiaire(
    exerciceMembreId: string,
    exerciceId: string
  ): Promise<BeneficiaireInfo> {
    // Trouver la prochaine distribution PLANIFIEE de l'exercice
    // Les distributions sont liées aux réunions de l'exercice
    const prochaineDistribution = await this.distributionRepo
      .createQueryBuilder('d')
      .innerJoin('d.reunion', 'r')
      .where('r.exerciceId = :exerciceId', { exerciceId })
      .andWhere('d.statut = :statut', { statut: StatutDistribution.PLANIFIEE })
      .orderBy('d.ordre', 'ASC')
      .getOne();

    if (!prochaineDistribution) {
      return { estBeneficiaire: false, ordreDistribution: null, montantAttendu: 0 };
    }

    const estBeneficiaire = prochaineDistribution.exerciceMembreBeneficiaireId === exerciceMembreId;

    return {
      estBeneficiaire,
      ordreDistribution: prochaineDistribution.ordre,
      montantAttendu: estBeneficiaire ? Number(prochaineDistribution.montantBrut) : 0,
    };
  }

  /**
   * Récupérer la prochaine réunion de l'exercice
   */
  private async getProchaineReunion(exerciceId: string): Promise<Reunion | null> {
    return this.reunionRepo
      .createQueryBuilder('r')
      .where('r.exerciceId = :exerciceId', { exerciceId })
      .andWhere('r.dateReunion >= :today', { today: new Date() })
      .orderBy('r.dateReunion', 'ASC')
      .getOne();
  }

  /**
   * Activité récente — 10 dernières transactions (agrégation SQL)
   */
  private async getActiviteRecente(
    exerciceMembreId: string
  ): Promise<MemberDashboardResponseDto['activiteRecente']> {
    const transactions = await this.txRepo.find({
      where: { exerciceMembreId },
      order: { creeLe: 'DESC' },
      take: 10, // PAGINATION : limite à 10
    });

    const creditTypes = [
      TypeTransaction.DECAISSEMENT_PRET,
      TypeTransaction.DEPENSE_SECOURS,
      TypeTransaction.POT,
    ];

    return transactions.map((tx) => ({
      id: tx.id,
      date: tx.creeLe instanceof Date ? tx.creeLe.toISOString() : String(tx.creeLe),
      type: tx.typeTransaction,
      montant: Number(tx.montant),
      sens: creditTypes.includes(tx.typeTransaction) ? ('CREDIT' as const) : ('DEBIT' as const),
      description: tx.description || tx.typeTransaction,
      statut: tx.statut,
    }));
  }
}

export const memberDashboardService = new MemberDashboardService();
