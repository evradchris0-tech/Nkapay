import { AppDataSource } from '../../../config';
import { ApiResponse } from '../../../shared';

import { Tontine, StatutTontine } from '../../tontines/entities/tontine.entity';
import { Exercice, StatutExercice } from '../../exercices/entities/exercice.entity';
import { Utilisateur } from '../../utilisateurs/entities/utilisateur.entity';
import { Reunion, StatutReunion } from '../../reunions/entities/reunion.entity';
import {
  Transaction,
  TypeTransaction,
  StatutTransaction,
} from '../../transactions/entities/transaction.entity';
import { Pret, StatutPret } from '../../prets/entities/pret.entity';
import { Distribution, StatutDistribution } from '../../distributions/entities/distribution.entity';
import { Penalite, StatutPenalite } from '../../penalites/entities/penalite.entity';
import { AdhesionTontine } from '../../tontines/entities/adhesion-tontine.entity';

export interface DashboardStatsDto {
  tontines: {
    total: number;
    actives: number;
    enPreparation: number;
  };
  exercices: {
    total: number;
    enCours: number;
  };
  membres: {
    total: number;
    nouveauxMois: number;
  };
  transactions: {
    totalCotisations: number;
    cotisationsMois: number;
    totalDistribue: number;
    pretsEnCours: number;
    totalPenalites: number;
  };
  reunions: {
    prochaine: {
      id: string;
      date: string;
      lieu: string;
      tontine: string;
    } | null;
    totalMois: number;
  };
}

export interface RecentActivityDto {
  type: 'cotisation' | 'pret' | 'distribution' | 'adhesion' | 'reunion';
  description: string;
  date: string;
  montant?: number;
  user?: string;
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function startOfNextMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 1);
}

export class DashboardService {
  private tontineRepo = AppDataSource.getRepository(Tontine);
  private exerciceRepo = AppDataSource.getRepository(Exercice);
  private userRepo = AppDataSource.getRepository(Utilisateur);
  private reunionRepo = AppDataSource.getRepository(Reunion);
  private transactionRepo = AppDataSource.getRepository(Transaction);
  private pretRepo = AppDataSource.getRepository(Pret);
  private distributionRepo = AppDataSource.getRepository(Distribution);
  private penaliteRepo = AppDataSource.getRepository(Penalite);
  private adhesionRepo = AppDataSource.getRepository(AdhesionTontine);

  async getStats() {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const nextMonthStart = startOfNextMonth(now);

    const [
      totalTontines,
      tontinesActives,
      tontinesEnPreparation,
      totalExercices,
      exercicesEnCours,
      totalMembres,
      nouveauxMois,
    ] = await Promise.all([
      this.tontineRepo.count(),
      this.tontineRepo.count({ where: { statut: StatutTontine.ACTIVE } }),
      this.tontineRepo.count({ where: { statut: StatutTontine.INACTIVE } }),
      this.exerciceRepo.count(),
      this.exerciceRepo.count({ where: { statut: StatutExercice.OUVERT } }),
      this.userRepo.count(),
      this.userRepo
        .createQueryBuilder('u')
        .where('u.dateInscription >= :monthStart', { monthStart })
        .getCount(),
    ]);

    const totalCotisationsRaw = await this.transactionRepo
      .createQueryBuilder('t')
      .select('COALESCE(SUM(t.montant), 0)', 'sum')
      .where('t.typeTransaction = :type', { type: TypeTransaction.COTISATION })
      .andWhere('t.statut = :statut', { statut: StatutTransaction.VALIDE })
      .getRawOne<{ sum: string }>();

    const cotisationsMoisRaw = await this.transactionRepo
      .createQueryBuilder('t')
      .select('COALESCE(SUM(t.montant), 0)', 'sum')
      .where('t.typeTransaction = :type', { type: TypeTransaction.COTISATION })
      .andWhere('t.statut = :statut', { statut: StatutTransaction.VALIDE })
      .andWhere('t.creeLe >= :monthStart', { monthStart })
      .getRawOne<{ sum: string }>();

    const totalDistribueRaw = await this.distributionRepo
      .createQueryBuilder('d')
      .select('COALESCE(SUM(d.montantNet), 0)', 'sum')
      .where('d.statut = :statut', { statut: StatutDistribution.DISTRIBUEE })
      .getRawOne<{ sum: string }>();

    const pretsEnCoursRaw = await this.pretRepo
      .createQueryBuilder('p')
      .select('COALESCE(SUM(p.capitalRestant), 0)', 'sum')
      .where('p.statut IN (:...statuts)', {
        statuts: [
          StatutPret.DEMANDE,
          StatutPret.APPROUVE,
          StatutPret.DECAISSE,
          StatutPret.EN_COURS,
        ],
      })
      .getRawOne<{ sum: string }>();

    const totalPenalitesRaw = await this.penaliteRepo
      .createQueryBuilder('p')
      .select('COALESCE(SUM(p.montant), 0)', 'sum')
      .where('p.statut = :statut', { statut: StatutPenalite.PAYEE })
      .getRawOne<{ sum: string }>();

    const prochaineReunion = await this.reunionRepo
      .createQueryBuilder('r')
      .leftJoinAndSelect('r.exercice', 'e')
      .leftJoinAndSelect('e.tontine', 't')
      .where('r.dateReunion >= :today', { today: now })
      .andWhere('r.statut IN (:...statuts)', {
        statuts: [StatutReunion.PLANIFIEE, StatutReunion.OUVERTE],
      })
      .orderBy('r.dateReunion', 'ASC')
      .addOrderBy('r.heureDebut', 'ASC')
      .getOne();

    const reunionsMois = await this.reunionRepo
      .createQueryBuilder('r')
      .where('r.dateReunion >= :monthStart', { monthStart })
      .andWhere('r.dateReunion < :nextMonthStart', { nextMonthStart })
      .getCount();

    const stats: DashboardStatsDto = {
      tontines: {
        total: totalTontines,
        actives: tontinesActives,
        enPreparation: tontinesEnPreparation,
      },
      exercices: {
        total: totalExercices,
        enCours: exercicesEnCours,
      },
      membres: {
        total: totalMembres,
        nouveauxMois,
      },
      transactions: {
        totalCotisations: Number(totalCotisationsRaw?.sum ?? 0),
        cotisationsMois: Number(cotisationsMoisRaw?.sum ?? 0),
        totalDistribue: Number(totalDistribueRaw?.sum ?? 0),
        pretsEnCours: Number(pretsEnCoursRaw?.sum ?? 0),
        totalPenalites: Number(totalPenalitesRaw?.sum ?? 0),
      },
      reunions: {
        prochaine: prochaineReunion
          ? {
              id: prochaineReunion.id,
              date:
                prochaineReunion.dateReunion instanceof Date
                  ? prochaineReunion.dateReunion.toISOString()
                  : String(prochaineReunion.dateReunion),
              lieu: prochaineReunion.lieu || '',
              tontine: prochaineReunion.exercice?.tontine?.nom || '',
            }
          : null,
        totalMois: reunionsMois,
      },
    };

    return ApiResponse.success(stats);
  }

  async getRecentActivities() {
    const activities: RecentActivityDto[] = [];

    const transactions = await this.transactionRepo
      .createQueryBuilder('t')
      .leftJoinAndSelect('t.exerciceMembre', 'em')
      .leftJoinAndSelect('em.adhesionTontine', 'adh')
      .leftJoinAndSelect('adh.utilisateur', 'u')
      .orderBy('t.creeLe', 'DESC')
      .take(10)
      .getMany();

    for (const tx of transactions) {
      let type: RecentActivityDto['type'] = 'cotisation';
      if (
        [TypeTransaction.DECAISSEMENT_PRET, TypeTransaction.REMBOURSEMENT_PRET].includes(
          tx.typeTransaction
        )
      ) {
        type = 'pret';
      } else if (tx.typeTransaction === TypeTransaction.COTISATION) {
        type = 'cotisation';
      }

      activities.push({
        type,
        description: tx.description || tx.typeTransaction,
        date: tx.creeLe.toISOString(),
        montant: Number(tx.montant),
        user: tx.exerciceMembre?.adhesionTontine?.utilisateur?.nomComplet,
      });
    }

    const adhesions = await this.adhesionRepo
      .createQueryBuilder('a')
      .leftJoinAndSelect('a.utilisateur', 'u')
      .orderBy('a.creeLe', 'DESC')
      .take(5)
      .getMany();

    for (const a of adhesions) {
      activities.push({
        type: 'adhesion',
        description: 'Nouveau membre',
        date: a.creeLe.toISOString(),
        user: a.utilisateur?.nomComplet,
      });
    }

    const reunions = await this.reunionRepo
      .createQueryBuilder('r')
      .leftJoinAndSelect('r.exercice', 'e')
      .leftJoinAndSelect('e.tontine', 't')
      .orderBy('r.creeLe', 'DESC')
      .take(5)
      .getMany();

    for (const r of reunions) {
      activities.push({
        type: 'reunion',
        description: `Réunion planifiée (${r.exercice?.tontine?.nom || ''})`,
        date: r.creeLe.toISOString(),
      });
    }

    const distributions = await this.distributionRepo
      .createQueryBuilder('d')
      .leftJoinAndSelect('d.exerciceMembreBeneficiaire', 'em')
      .leftJoinAndSelect('em.adhesionTontine', 'adh')
      .leftJoinAndSelect('adh.utilisateur', 'u')
      .orderBy('d.creeLe', 'DESC')
      .take(5)
      .getMany();

    for (const d of distributions) {
      activities.push({
        type: 'distribution',
        description: 'Distribution effectuée',
        date: d.creeLe.toISOString(),
        montant: Number(d.montantNet),
        user: d.exerciceMembreBeneficiaire?.adhesionTontine?.utilisateur?.nomComplet,
      });
    }

    activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return ApiResponse.success(activities.slice(0, 10));
  }
}

export const dashboardService = new DashboardService();
