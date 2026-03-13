/**
 * Service d'export principal (orchestrateur)
 * Agrège les données depuis la base et délègue la génération au service PDF ou Excel
 */

import { Repository } from 'typeorm';
import { AppDataSource } from '../../../config';
import { NotFoundError } from '../../../shared';

import { ExerciceMembre } from '../../exercices/entities/exercice-membre.entity';
import { Exercice } from '../../exercices/entities/exercice.entity';
import {
  Transaction,
  TypeTransaction,
  StatutTransaction,
} from '../../transactions/entities/transaction.entity';
import { Pret, StatutPret } from '../../prets/entities/pret.entity';
import { Reunion } from '../../reunions/entities/reunion.entity';
import { CotisationDueMensuelle } from '../../transactions/entities/cotisation-due-mensuelle.entity';
import { Penalite, StatutPenalite } from '../../penalites/entities/penalite.entity';
import { RemboursementPret } from '../../prets/entities/remboursement-pret.entity';
import { Distribution, StatutDistribution } from '../../distributions/entities/distribution.entity';
import { Tontine } from '../../tontines/entities/tontine.entity';
import { AdhesionTontine, StatutAdhesion } from '../../tontines/entities/adhesion-tontine.entity';
import { Organisation } from '../../organisations/entities/organisation.entity';
import {
  EvenementSecours,
  StatutEvenementSecours,
} from '../../secours/entities/evenement-secours.entity';
import { PresenceReunion } from '../../reunions/entities/presence-reunion.entity';

import { pdfExportService } from './pdf-export.service';
import { excelExportService } from './excel-export.service';
import { ExportStrategy } from '../interfaces/export-strategy.interface';
import {
  ReleveCompteData,
  RapportExerciceData,
  RapportMensuelData,
  ListeMembresData,
  RapportOrganisationData,
  PortefeuillePretsData,
  PresencesAssiduiteData,
  CotisationsArrieresData,
  EvenementsSecoursData,
  BilanFinancierAnnuelData,
} from '../types/export-data.types';

// =============================================================================
// Types
// =============================================================================

export type ExportFormat = 'pdf' | 'excel';

export interface ExportResult {
  buffer: Buffer;
  filename: string;
  contentType: string;
}

// =============================================================================
// Service
// =============================================================================

export class ExportService {
  // Registre de stratégies (Design Pattern: Strategy)
  private readonly strategies: Map<ExportFormat, ExportStrategy> = new Map<
    ExportFormat,
    ExportStrategy
  >([
    ['pdf', pdfExportService],
    ['excel', excelExportService],
  ]);
  // Repositories lazy
  private get emRepo(): Repository<ExerciceMembre> {
    return AppDataSource.getRepository(ExerciceMembre);
  }
  private get exerciceRepo(): Repository<Exercice> {
    return AppDataSource.getRepository(Exercice);
  }
  private get txRepo(): Repository<Transaction> {
    return AppDataSource.getRepository(Transaction);
  }
  private get pretRepo(): Repository<Pret> {
    return AppDataSource.getRepository(Pret);
  }
  private get reunionRepo(): Repository<Reunion> {
    return AppDataSource.getRepository(Reunion);
  }
  private get cotisationDueRepo(): Repository<CotisationDueMensuelle> {
    return AppDataSource.getRepository(CotisationDueMensuelle);
  }
  private get penaliteRepo(): Repository<Penalite> {
    return AppDataSource.getRepository(Penalite);
  }
  private get remboursementRepo(): Repository<RemboursementPret> {
    return AppDataSource.getRepository(RemboursementPret);
  }
  private get distributionRepo(): Repository<Distribution> {
    return AppDataSource.getRepository(Distribution);
  }
  private get tontineRepo(): Repository<Tontine> {
    return AppDataSource.getRepository(Tontine);
  }
  private get adhesionRepo(): Repository<AdhesionTontine> {
    return AppDataSource.getRepository(AdhesionTontine);
  }
  private get organisationRepo(): Repository<Organisation> {
    return AppDataSource.getRepository(Organisation);
  }
  private get evenementSecoursRepo(): Repository<EvenementSecours> {
    return AppDataSource.getRepository(EvenementSecours);
  }
  private get presenceRepo(): Repository<PresenceReunion> {
    return AppDataSource.getRepository(PresenceReunion);
  }

  // =========================================================================
  // RELEVÉ DE COMPTE INDIVIDUEL
  // =========================================================================

  async exportReleveCompte(exerciceMembreId: string, format: ExportFormat): Promise<ExportResult> {
    const strategy = this.strategies.get(format);
    if (!strategy) throw new NotFoundError(`Format d'export non supporté: ${format}`);

    const data = await this.buildReleveCompteData(exerciceMembreId);

    const nomMembre = data.membre.nom.replace(/\s+/g, '_');
    const filename = `releve_${nomMembre}_${new Date().toISOString().substring(0, 10)}.${strategy.getExtension()}`;

    const buffer = await strategy.genererReleveCompte(data);

    return {
      buffer,
      filename,
      contentType: strategy.getContentType(),
    };
  }

  private async buildReleveCompteData(exerciceMembreId: string): Promise<ReleveCompteData> {
    const membre = await this.emRepo.findOne({
      where: { id: exerciceMembreId },
      relations: ['adhesionTontine', 'adhesionTontine.utilisateur', 'exercice', 'exercice.tontine'],
    });

    if (!membre) throw new NotFoundError(`Membre d'exercice non trouvé: ${exerciceMembreId}`);

    const utilisateur = membre.adhesionTontine.utilisateur;
    const tontine = membre.exercice.tontine;
    const exercice = membre.exercice;

    // Transactions
    const transactions = await this.txRepo.find({
      where: { exerciceMembreId, statut: StatutTransaction.VALIDE },
      order: { creeLe: 'ASC' },
    });

    // Calculer le solde glissant
    let soldeGlissant = 0;
    const txRows = transactions.map((tx) => {
      const montant = Number(tx.montant);
      const isCredit = [
        TypeTransaction.DECAISSEMENT_PRET,
        TypeTransaction.DEPENSE_SECOURS,
        TypeTransaction.POT,
      ].includes(tx.typeTransaction);
      const debit = isCredit ? 0 : montant;
      const credit = isCredit ? montant : 0;
      soldeGlissant += credit - debit;

      return {
        date: tx.creeLe instanceof Date ? tx.creeLe.toISOString() : String(tx.creeLe),
        reference: tx.reference,
        type: this.formatTypeTransaction(tx.typeTransaction),
        description: tx.description || '',
        debit,
        credit,
        solde: soldeGlissant,
      };
    });

    // Soldes agrégés
    const totalCotise = transactions
      .filter((t) => t.typeTransaction === TypeTransaction.COTISATION)
      .reduce((sum, t) => sum + Number(t.montant), 0);
    const totalEpargne = transactions
      .filter((t) => t.typeTransaction === TypeTransaction.EPARGNE)
      .reduce((sum, t) => sum + Number(t.montant), 0);
    const totalSecours = transactions
      .filter((t) => t.typeTransaction === TypeTransaction.SECOURS)
      .reduce((sum, t) => sum + Number(t.montant), 0);

    // Dettes
    const dettesRaw = await this.cotisationDueRepo
      .createQueryBuilder('c')
      .select('COALESCE(SUM(c.soldeRestant), 0)', 'total')
      .where('c.exerciceMembreId = :id', { id: exerciceMembreId })
      .andWhere('c.soldeRestant > 0')
      .getRawOne<{ total: string }>();
    const amendesRaw = await this.penaliteRepo
      .createQueryBuilder('p')
      .select('COALESCE(SUM(p.montant), 0)', 'total')
      .where('p.exerciceMembreId = :id', { id: exerciceMembreId })
      .andWhere('p.statut = :statut', { statut: StatutPenalite.EN_ATTENTE })
      .getRawOne<{ total: string }>();
    const totalDettes = Number(dettesRaw?.total ?? 0) + Number(amendesRaw?.total ?? 0);

    // Prêt
    const pretActif = await this.pretRepo.findOne({
      where: { exerciceMembreId, statut: StatutPret.EN_COURS },
    });

    const dateDebut = new Date(exercice.anneeDebut, exercice.moisDebut - 1, 1);
    const dateFin = new Date(exercice.anneeFin, exercice.moisFin - 1, 30);

    return {
      header: {
        tontineName: tontine.nom,
        reportTitle: 'Relevé de Compte Individuel',
        periode: `${dateDebut.toLocaleDateString('fr-FR')} — ${dateFin.toLocaleDateString('fr-FR')}`,
        genereLe: new Date(),
      },
      membre: {
        nom: utilisateur ? `${utilisateur.prenom} ${utilisateur.nom}` : 'Inconnu',
        role: membre.adhesionTontine.role,
        parts: membre.nombreParts,
      },
      solde: {
        totalCotise,
        totalDettes,
        totalEpargne,
        totalSecours,
      },
      transactions: txRows,
      pret: pretActif
        ? {
            montantCapital: Number(pretActif.montantCapital),
            capitalRestant: Number(pretActif.capitalRestant),
            tauxInteret: Number(pretActif.tauxInteret),
            dateDecaissement: pretActif.dateDecaissement
              ? pretActif.dateDecaissement.toISOString().substring(0, 10)
              : 'N/A',
            dateEcheance: pretActif.dateEcheance
              ? pretActif.dateEcheance.toISOString().substring(0, 10)
              : 'N/A',
            statut: pretActif.statut,
          }
        : null,
    };
  }

  // =========================================================================
  // RAPPORT DE FIN D'EXERCICE
  // =========================================================================

  async exportRapportExercice(exerciceId: string, format: ExportFormat): Promise<ExportResult> {
    const strategy = this.strategies.get(format);
    if (!strategy) throw new NotFoundError(`Format d'export non supporté: ${format}`);

    const data = await this.buildRapportExerciceData(exerciceId);

    const filename = `rapport_exercice_${new Date().toISOString().substring(0, 10)}.${strategy.getExtension()}`;

    const buffer = await strategy.genererRapportExercice(data);

    return {
      buffer,
      filename,
      contentType: strategy.getContentType(),
    };
  }

  private async buildRapportExerciceData(exerciceId: string): Promise<RapportExerciceData> {
    const exercice = await this.exerciceRepo.findOne({
      where: { id: exerciceId },
      relations: [
        'tontine',
        'membres',
        'membres.adhesionTontine',
        'membres.adhesionTontine.utilisateur',
      ],
    });

    if (!exercice) throw new NotFoundError(`Exercice non trouvé: ${exerciceId}`);

    const tontine = exercice.tontine;
    const membres = exercice.membres || [];

    // Totaux globaux via SQL
    const [
      totalCotisationsRaw,
      totalDistribRaw,
      totalPretsRaw,
      totalPenalitesRaw,
      totalSecoursRaw,
      totalEpargneRaw,
    ] = await Promise.all([
      this.txRepo
        .createQueryBuilder('t')
        .select('COALESCE(SUM(t.montant), 0)', 'total')
        .innerJoin('t.exerciceMembre', 'em')
        .where('em.exerciceId = :exerciceId', { exerciceId })
        .andWhere('t.typeTransaction = :type', { type: TypeTransaction.COTISATION })
        .andWhere('t.statut = :statut', { statut: StatutTransaction.VALIDE })
        .getRawOne<{ total: string }>(),
      this.distributionRepo
        .createQueryBuilder('d')
        .select('COALESCE(SUM(d.montantNet), 0)', 'total')
        .innerJoin('d.reunion', 'r')
        .where('r.exerciceId = :exerciceId', { exerciceId })
        .andWhere('d.statut = :statut', { statut: StatutDistribution.DISTRIBUEE })
        .getRawOne<{ total: string }>(),
      this.pretRepo
        .createQueryBuilder('p')
        .select('COALESCE(SUM(p.montantCapital), 0)', 'total')
        .innerJoin('p.exerciceMembre', 'em')
        .where('em.exerciceId = :exerciceId', { exerciceId })
        .getRawOne<{ total: string }>(),
      this.penaliteRepo
        .createQueryBuilder('p')
        .select('COALESCE(SUM(p.montant), 0)', 'total')
        .innerJoin('p.exerciceMembre', 'em')
        .where('em.exerciceId = :exerciceId', { exerciceId })
        .andWhere('p.statut = :statut', { statut: StatutPenalite.PAYEE })
        .getRawOne<{ total: string }>(),
      this.txRepo
        .createQueryBuilder('t')
        .select('COALESCE(SUM(t.montant), 0)', 'total')
        .innerJoin('t.exerciceMembre', 'em')
        .where('em.exerciceId = :exerciceId', { exerciceId })
        .andWhere('t.typeTransaction = :type', { type: TypeTransaction.DEPENSE_SECOURS })
        .andWhere('t.statut = :statut', { statut: StatutTransaction.VALIDE })
        .getRawOne<{ total: string }>(),
      this.txRepo
        .createQueryBuilder('t')
        .select('COALESCE(SUM(t.montant), 0)', 'total')
        .innerJoin('t.exerciceMembre', 'em')
        .where('em.exerciceId = :exerciceId', { exerciceId })
        .andWhere('t.typeTransaction = :type', { type: TypeTransaction.EPARGNE })
        .andWhere('t.statut = :statut', { statut: StatutTransaction.VALIDE })
        .getRawOne<{ total: string }>(),
    ]);

    // Détail par membre
    const membresDetail = await Promise.all(
      membres.map(async (m) => {
        const utilisateur = m.adhesionTontine?.utilisateur;
        const nom = utilisateur ? `${utilisateur.prenom} ${utilisateur.nom}` : 'Inconnu';
        const cotise = await this.txRepo
          .createQueryBuilder('t')
          .select('COALESCE(SUM(t.montant), 0)', 'total')
          .where('t.exerciceMembreId = :id', { id: m.id })
          .andWhere('t.typeTransaction = :type', { type: TypeTransaction.COTISATION })
          .andWhere('t.statut = :statut', { statut: StatutTransaction.VALIDE })
          .getRawOne<{ total: string }>();
        const distribRaw = await this.distributionRepo
          .createQueryBuilder('d')
          .select('COALESCE(SUM(d.montantNet), 0)', 'total')
          .where('d.exerciceMembreBeneficiaireId = :id', { id: m.id })
          .andWhere('d.statut = :statut', { statut: StatutDistribution.DISTRIBUEE })
          .getRawOne<{ total: string }>();
        const dettesRaw = await this.cotisationDueRepo
          .createQueryBuilder('c')
          .select('COALESCE(SUM(c.soldeRestant), 0)', 'total')
          .where('c.exerciceMembreId = :id', { id: m.id })
          .andWhere('c.soldeRestant > 0')
          .getRawOne<{ total: string }>();

        return {
          nom,
          role: m.adhesionTontine?.role || 'MEMBRE',
          parts: m.nombreParts,
          cotise: Number(cotise?.total ?? 0),
          recu: Number(distribRaw?.total ?? 0),
          dettes: Number(dettesRaw?.total ?? 0),
          statut: m.statut,
        };
      })
    );

    // Réunions
    const reunions = await this.reunionRepo.find({
      where: { exerciceId },
      order: { dateReunion: 'ASC' },
    });

    const reunionsDetail = await Promise.all(
      reunions.map(async (r, i) => {
        const distrib = await this.distributionRepo.findOne({
          where: { reunionId: r.id, statut: StatutDistribution.DISTRIBUEE },
          relations: [
            'exerciceMembreBeneficiaire',
            'exerciceMembreBeneficiaire.adhesionTontine',
            'exerciceMembreBeneficiaire.adhesionTontine.utilisateur',
          ],
        });
        const u = distrib?.exerciceMembreBeneficiaire?.adhesionTontine?.utilisateur;

        return {
          numero: i + 1,
          date: r.dateReunion instanceof Date ? r.dateReunion.toISOString() : String(r.dateReunion),
          lieu: r.lieu || '',
          beneficiaire: u ? `${u.prenom} ${u.nom}` : distrib ? 'N/A' : 'Aucun',
          montantDistribue: distrib ? Number(distrib.montantNet) : 0,
          statut: r.statut,
        };
      })
    );

    const dateDebut = new Date(exercice.anneeDebut, exercice.moisDebut - 1, 1);
    const dateFin = new Date(exercice.anneeFin, exercice.moisFin - 1, 30);

    return {
      header: {
        tontineName: tontine.nom,
        reportTitle: "Rapport de Fin d'Exercice",
        subtitle: exercice.libelle,
        periode: `${dateDebut.toLocaleDateString('fr-FR')} — ${dateFin.toLocaleDateString('fr-FR')}`,
        genereLe: new Date(),
      },
      resume: {
        totalMembres: membres.length,
        totalCotisations: Number(totalCotisationsRaw?.total ?? 0),
        totalDistributions: Number(totalDistribRaw?.total ?? 0),
        totalPrets: Number(totalPretsRaw?.total ?? 0),
        totalPenalites: Number(totalPenalitesRaw?.total ?? 0),
        totalSecours: Number(totalSecoursRaw?.total ?? 0),
        soldeEpargne: Number(totalEpargneRaw?.total ?? 0),
      },
      membresDetail,
      reunions: reunionsDetail,
    };
  }

  // =========================================================================
  // RAPPORT MENSUEL (PAR RÉUNION)
  // =========================================================================

  async exportRapportMensuel(reunionId: string, format: ExportFormat): Promise<ExportResult> {
    const strategy = this.strategies.get(format);
    if (!strategy) throw new NotFoundError(`Format d'export non supporté: ${format}`);

    const data = await this.buildRapportMensuelData(reunionId);

    const filename = `rapport_reunion_${data.reunion.numero}_${new Date().toISOString().substring(0, 10)}.${strategy.getExtension()}`;

    const buffer = await strategy.genererRapportMensuel(data);

    return {
      buffer,
      filename,
      contentType: strategy.getContentType(),
    };
  }

  private async buildRapportMensuelData(reunionId: string): Promise<RapportMensuelData> {
    const reunion = await this.reunionRepo.findOne({
      where: { id: reunionId },
      relations: ['exercice', 'exercice.tontine'],
    });

    if (!reunion) throw new NotFoundError(`Réunion non trouvée: ${reunionId}`);

    const exercice = reunion.exercice;
    const tontine = exercice.tontine;

    // Numéro de réunion
    const allReunions = await this.reunionRepo.find({
      where: { exerciceId: exercice.id },
      order: { dateReunion: 'ASC' },
    });
    const reunionNumero = allReunions.findIndex((r) => r.id === reunionId) + 1;

    // Bénéficiaire
    const distrib = await this.distributionRepo.findOne({
      where: { reunionId },
      relations: [
        'exerciceMembreBeneficiaire',
        'exerciceMembreBeneficiaire.adhesionTontine',
        'exerciceMembreBeneficiaire.adhesionTontine.utilisateur',
      ],
    });
    const benefUser = distrib?.exerciceMembreBeneficiaire?.adhesionTontine?.utilisateur;

    // Cotisations
    const cotisations = await this.cotisationDueRepo.find({
      where: { reunionId },
      relations: [
        'exerciceMembre',
        'exerciceMembre.adhesionTontine',
        'exerciceMembre.adhesionTontine.utilisateur',
      ],
    });

    // Remboursements de prêts
    const remboursements = await this.remboursementRepo.find({
      where: { reunionId },
      relations: [
        'pret',
        'pret.exerciceMembre',
        'pret.exerciceMembre.adhesionTontine',
        'pret.exerciceMembre.adhesionTontine.utilisateur',
      ],
    });

    // Pénalités
    const penalites = await this.penaliteRepo.find({
      where: { reunionId },
      relations: [
        'exerciceMembre',
        'exerciceMembre.adhesionTontine',
        'exerciceMembre.adhesionTontine.utilisateur',
        'typePenalite',
      ],
    });

    const totalCotisations = cotisations.reduce((sum, c) => sum + Number(c.montantPaye), 0);
    const totalRemboursements = remboursements.reduce((sum, r) => sum + Number(r.montantTotal), 0);
    const totalPenalites = penalites
      .filter((p) => p.statut === StatutPenalite.PAYEE)
      .reduce((sum, p) => sum + Number(p.montant), 0);

    return {
      header: {
        tontineName: tontine.nom,
        reportTitle: `Rapport Réunion N°${reunionNumero}`,
        subtitle: exercice.libelle,
        periode:
          reunion.dateReunion instanceof Date
            ? reunion.dateReunion.toLocaleDateString('fr-FR')
            : String(reunion.dateReunion),
        genereLe: new Date(),
      },
      reunion: {
        numero: reunionNumero,
        date:
          reunion.dateReunion instanceof Date
            ? reunion.dateReunion.toISOString()
            : String(reunion.dateReunion),
        lieu: reunion.lieu || '',
        beneficiaire: benefUser ? `${benefUser.prenom} ${benefUser.nom}` : 'N/A',
        montantDistribue: distrib ? Number(distrib.montantNet) : 0,
      },
      cotisations: cotisations.map((c) => {
        const u = c.exerciceMembre?.adhesionTontine?.utilisateur;
        return {
          membre: u ? `${u.prenom} ${u.nom}` : 'Inconnu',
          montantDu: Number(c.montantDu),
          montantPaye: Number(c.montantPaye),
          soldeRestant: Number(c.soldeRestant),
          statut: c.statut,
        };
      }),
      prets: remboursements.map((r) => {
        const u = r.pret?.exerciceMembre?.adhesionTontine?.utilisateur;
        return {
          membre: u ? `${u.prenom} ${u.nom}` : 'Inconnu',
          montantRembourse: Number(r.montantTotal),
          capitalRestant: Number(r.capitalRestantApres),
        };
      }),
      penalites: penalites.map((p) => {
        const u = p.exerciceMembre?.adhesionTontine?.utilisateur;
        return {
          membre: u ? `${u.prenom} ${u.nom}` : 'Inconnu',
          motif: p.typePenalite?.libelle || p.motif || 'N/A',
          montant: Number(p.montant),
          statut: p.statut,
        };
      }),
      totaux: {
        totalCotisations,
        totalRemboursements,
        totalPenalites,
        totalReunion: totalCotisations + totalRemboursements + totalPenalites,
      },
    };
  }

  // =========================================================================
  // RAPPORT 4 — LISTE DES MEMBRES
  // =========================================================================

  async exportListeMembres(tontineId: string, format: ExportFormat): Promise<ExportResult> {
    const strategy = this.strategies.get(format);
    if (!strategy) throw new NotFoundError(`Format d'export non supporté: ${format}`);
    const data = await this.buildListeMembresData(tontineId);
    const filename = `membres_${data.tontine.nom.replace(/\s+/g, '_')}_${new Date().toISOString().substring(0, 10)}.${strategy.getExtension()}`;
    const buffer = await strategy.genererListeMembres(data);
    return { buffer, filename, contentType: strategy.getContentType() };
  }

  private async buildListeMembresData(tontineId: string): Promise<ListeMembresData> {
    const tontine = await this.tontineRepo.findOne({
      where: { id: tontineId },
      relations: ['tontineType'],
    });
    if (!tontine) throw new NotFoundError(`Tontine non trouvée: ${tontineId}`);

    const adhesions = await this.adhesionRepo.find({
      where: { tontineId },
      relations: ['utilisateur'],
      order: { creeLe: 'ASC' },
    });

    const membres = adhesions.map((a, i) => ({
      matricule: `M${String(i + 1).padStart(3, '0')}`,
      nom: a.utilisateur?.nom || '',
      prenom: a.utilisateur?.prenom || '',
      telephone: a.utilisateur?.telephone1 || '',
      role: a.role,
      statut: a.statut,
      dateAdhesion: a.creeLe instanceof Date ? a.creeLe.toISOString().substring(0, 10) : String(a.creeLe),
      nombreParts: 1,
    }));

    const totalActifs = adhesions.filter((a) => a.statut === StatutAdhesion.ACTIVE).length;

    return {
      header: {
        tontineName: tontine.nom,
        reportTitle: 'Liste des Membres',
        genereLe: new Date(),
      },
      tontine: {
        id: tontine.id,
        nom: tontine.nom,
        nomCourt: tontine.nomCourt || undefined,
        type: (tontine as any).tontineType?.libelle,
      },
      membres,
      totaux: {
        totalActifs,
        totalInactifs: membres.length - totalActifs,
        totalMembres: membres.length,
      },
    };
  }

  // =========================================================================
  // RAPPORT 5 — RAPPORT ORGANISATION
  // =========================================================================

  async exportRapportOrganisation(organisationId: string, format: ExportFormat): Promise<ExportResult> {
    const strategy = this.strategies.get(format);
    if (!strategy) throw new NotFoundError(`Format d'export non supporté: ${format}`);
    const data = await this.buildRapportOrganisationData(organisationId);
    const filename = `rapport_org_${data.organisation.slug}_${new Date().toISOString().substring(0, 10)}.${strategy.getExtension()}`;
    const buffer = await strategy.genererRapportOrganisation(data);
    return { buffer, filename, contentType: strategy.getContentType() };
  }

  private async buildRapportOrganisationData(organisationId: string): Promise<RapportOrganisationData> {
    const organisation = await this.organisationRepo.findOne({
      where: { id: organisationId },
      relations: ['planAbonnement'],
    });
    if (!organisation) throw new NotFoundError(`Organisation non trouvée: ${organisationId}`);

    const tontines = await this.tontineRepo.find({ where: { organisationId } });

    const tontinesDetail = await Promise.all(
      tontines.map(async (t) => {
        const nbMembres = await this.adhesionRepo.count({
          where: { tontineId: t.id, statut: StatutAdhesion.ACTIVE },
        });
        const exerciceActif = await this.exerciceRepo.findOne({
          where: { tontineId: t.id, statut: 'OUVERT' as any },
          select: ['id', 'libelle'],
        });
        return {
          id: t.id,
          nom: t.nom,
          type: t.tontineTypeId || 'N/A',
          statut: t.statut,
          nbMembres,
          exerciceActif: exerciceActif?.libelle || null,
        };
      })
    );

    const nbMembresTotal = await this.adhesionRepo
      .createQueryBuilder('a')
      .innerJoin('a.tontine', 't')
      .where('t.organisationId = :organisationId', { organisationId })
      .andWhere('a.statut = :statut', { statut: StatutAdhesion.ACTIVE })
      .getCount();

    const tontineIds = tontines.map((t) => t.id);
    let totalCotise = 0;
    let totalDistribue = 0;
    let pretsEnCours = 0;
    let pretsEnCoursMontant = 0;

    if (tontineIds.length > 0) {
      const cotiseRaw = await this.txRepo
        .createQueryBuilder('t')
        .select('COALESCE(SUM(t.montant), 0)', 'total')
        .innerJoin('t.exerciceMembre', 'em')
        .innerJoin('em.exercice', 'ex')
        .where('ex.tontineId IN (:...tontineIds)', { tontineIds })
        .andWhere('t.typeTransaction = :type', { type: TypeTransaction.COTISATION })
        .andWhere('t.statut = :statut', { statut: StatutTransaction.VALIDE })
        .getRawOne<{ total: string }>();
      totalCotise = Number(cotiseRaw?.total ?? 0);

      const distribRaw = await this.distributionRepo
        .createQueryBuilder('d')
        .select('COALESCE(SUM(d.montantNet), 0)', 'total')
        .innerJoin('d.reunion', 'r')
        .innerJoin('r.exercice', 'ex')
        .where('ex.tontineId IN (:...tontineIds)', { tontineIds })
        .andWhere('d.statut = :statut', { statut: StatutDistribution.DISTRIBUEE })
        .getRawOne<{ total: string }>();
      totalDistribue = Number(distribRaw?.total ?? 0);

      const pretsRaw = await this.pretRepo
        .createQueryBuilder('p')
        .select('COUNT(p.id)', 'count')
        .addSelect('COALESCE(SUM(p.capitalRestant), 0)', 'montant')
        .innerJoin('p.exerciceMembre', 'em')
        .innerJoin('em.exercice', 'ex')
        .where('ex.tontineId IN (:...tontineIds)', { tontineIds })
        .andWhere('p.statut = :statut', { statut: StatutPret.EN_COURS })
        .getRawOne<{ count: string; montant: string }>();
      pretsEnCours = Number(pretsRaw?.count ?? 0);
      pretsEnCoursMontant = Number(pretsRaw?.montant ?? 0);
    }

    return {
      header: {
        tontineName: organisation.nom,
        reportTitle: 'Rapport Organisation',
        genereLe: new Date(),
      },
      organisation: {
        id: organisation.id,
        nom: organisation.nom,
        slug: organisation.slug,
        plan: organisation.planAbonnement?.code || 'FREE',
        pays: organisation.pays,
        devise: organisation.devise,
        dateCreation: organisation.creeLe instanceof Date
          ? organisation.creeLe.toISOString().substring(0, 10)
          : String(organisation.creeLe),
        nbTontines: tontines.length,
        nbMembresTotal,
      },
      tontines: tontinesDetail,
      consolidation: { totalCotise, totalDistribue, pretsEnCours, pretsEnCoursMontant },
    };
  }

  // =========================================================================
  // RAPPORT 6 — PORTEFEUILLE PRÊTS
  // =========================================================================

  async exportPortefeuillePrets(exerciceId: string, format: ExportFormat): Promise<ExportResult> {
    const strategy = this.strategies.get(format);
    if (!strategy) throw new NotFoundError(`Format d'export non supporté: ${format}`);
    const data = await this.buildPortefeuillePretsData(exerciceId);
    const filename = `prets_exercice_${data.exercice.annee}_${new Date().toISOString().substring(0, 10)}.${strategy.getExtension()}`;
    const buffer = await strategy.genererPortefeuillePrets(data);
    return { buffer, filename, contentType: strategy.getContentType() };
  }

  private async buildPortefeuillePretsData(exerciceId: string): Promise<PortefeuillePretsData> {
    const exercice = await this.exerciceRepo.findOne({
      where: { id: exerciceId },
      relations: ['tontine'],
    });
    if (!exercice) throw new NotFoundError(`Exercice non trouvé: ${exerciceId}`);

    const prets = await this.pretRepo.find({
      where: { exerciceMembre: { exerciceId } } as any,
      relations: ['exerciceMembre', 'exerciceMembre.adhesionTontine', 'exerciceMembre.adhesionTontine.utilisateur'],
    });

    const pretsActifs = prets
      .filter((p) => [StatutPret.EN_COURS, StatutPret.DECAISSE].includes(p.statut))
      .map((p) => {
        const u = p.exerciceMembre?.adhesionTontine?.utilisateur;
        return {
          membre: u ? `${u.prenom} ${u.nom}` : 'Inconnu',
          montantCapital: Number(p.montantCapital),
          tauxInteret: Number(p.tauxInteret),
          capitalRestant: Number(p.capitalRestant),
          dateEcheance: p.dateEcheance ? p.dateEcheance.toISOString().substring(0, 10) : 'N/A',
          statut: p.statut,
        };
      });

    const pretsSoldes = prets
      .filter((p) => p.statut === StatutPret.SOLDE)
      .map((p) => {
        const u = p.exerciceMembre?.adhesionTontine?.utilisateur;
        const interets = Number(p.montantCapital) * (Number(p.tauxInteret) / 100) * (Number(p.dureeMois) / 12);
        return {
          membre: u ? `${u.prenom} ${u.nom}` : 'Inconnu',
          montantCapital: Number(p.montantCapital),
          interetsPaies: Math.round(interets),
          dateSolde: p.dateSolde ? p.dateSolde.toISOString().substring(0, 10) : 'N/A',
        };
      });

    const totalDecaisse = prets.reduce((s, p) => s + Number(p.montantCapital), 0);
    const totalRembourse = prets.reduce((s, p) => s + (Number(p.montantCapital) - Number(p.capitalRestant)), 0);
    const interetsCollectes = prets
      .filter((p) => p.statut === StatutPret.SOLDE)
      .reduce((s, p) => {
        const i = Number(p.montantCapital) * (Number(p.tauxInteret) / 100) * (Number(p.dureeMois) / 12);
        return s + Math.round(i);
      }, 0);
    const tauxRecouvrement = totalDecaisse > 0 ? Math.round((totalRembourse / totalDecaisse) * 100) : 0;

    return {
      header: {
        tontineName: exercice.tontine.nom,
        reportTitle: 'Portefeuille des Prêts',
        subtitle: exercice.libelle,
        genereLe: new Date(),
      },
      exercice: { id: exercice.id, annee: exercice.anneeDebut, statut: exercice.statut },
      pretsActifs,
      pretsSoldes,
      kpis: {
        totalDecaisse,
        totalRembourse,
        interetsCollectes,
        tauxRecouvrement,
        nbPretsActifs: pretsActifs.length,
        nbPretsSoldes: pretsSoldes.length,
      },
    };
  }

  // =========================================================================
  // RAPPORT 7 — PRÉSENCES & ASSIDUITÉ
  // =========================================================================

  async exportPresencesAssiduite(exerciceId: string, format: ExportFormat): Promise<ExportResult> {
    const strategy = this.strategies.get(format);
    if (!strategy) throw new NotFoundError(`Format d'export non supporté: ${format}`);
    const data = await this.buildPresencesAssiduiteData(exerciceId);
    const filename = `presences_exercice_${data.exercice.annee}_${new Date().toISOString().substring(0, 10)}.${strategy.getExtension()}`;
    const buffer = await strategy.genererPresencesAssiduite(data);
    return { buffer, filename, contentType: strategy.getContentType() };
  }

  private async buildPresencesAssiduiteData(exerciceId: string): Promise<PresencesAssiduiteData> {
    const exercice = await this.exerciceRepo.findOne({
      where: { id: exerciceId },
      relations: ['tontine', 'membres', 'membres.adhesionTontine', 'membres.adhesionTontine.utilisateur'],
    });
    if (!exercice) throw new NotFoundError(`Exercice non trouvé: ${exerciceId}`);

    const reunions = await this.reunionRepo.find({
      where: { exerciceId },
      order: { dateReunion: 'ASC' },
    });
    const nbReunionsTotal = reunions.length;

    const membres = exercice.membres || [];

    const parMembre = await Promise.all(
      membres.map(async (m) => {
        const u = m.adhesionTontine?.utilisateur;
        const presences = await this.presenceRepo.find({ where: { exerciceMembreId: m.id } });
        const nbPresences = presences.filter((p) => p.estPresent).length;
        const nbAbsences = nbReunionsTotal - nbPresences;
        return {
          nom: u ? `${u.prenom} ${u.nom}` : 'Inconnu',
          nbPresences,
          nbAbsences: Math.max(0, nbAbsences),
          nbReunionsTotal,
          tauxPresence: nbReunionsTotal > 0 ? Math.round((nbPresences / nbReunionsTotal) * 100) : 0,
        };
      })
    );

    const parReunion = await Promise.all(
      reunions.map(async (r, i) => {
        const presences = await this.presenceRepo.find({ where: { reunionId: r.id } });
        const nbPresents = presences.filter((p) => p.estPresent).length;
        const nbAbsents = presences.length - nbPresents;
        return {
          numero: i + 1,
          date: r.dateReunion instanceof Date ? r.dateReunion.toISOString().substring(0, 10) : String(r.dateReunion),
          nbPresents,
          nbAbsents,
          tauxPresence: presences.length > 0 ? Math.round((nbPresents / presences.length) * 100) : 0,
        };
      })
    );

    return {
      header: {
        tontineName: exercice.tontine.nom,
        reportTitle: 'Présences & Assiduité',
        subtitle: exercice.libelle,
        genereLe: new Date(),
      },
      exercice: { id: exercice.id, annee: exercice.anneeDebut },
      parMembre,
      parReunion,
    };
  }

  // =========================================================================
  // RAPPORT 8 — COTISATIONS & ARRIÉRÉS
  // =========================================================================

  async exportCotisationsArrieres(exerciceId: string, format: ExportFormat): Promise<ExportResult> {
    const strategy = this.strategies.get(format);
    if (!strategy) throw new NotFoundError(`Format d'export non supporté: ${format}`);
    const data = await this.buildCotisationsArrieresData(exerciceId);
    const filename = `arrierees_exercice_${data.exercice.annee}_${new Date().toISOString().substring(0, 10)}.${strategy.getExtension()}`;
    const buffer = await strategy.genererCotisationsArrieres(data);
    return { buffer, filename, contentType: strategy.getContentType() };
  }

  private async buildCotisationsArrieresData(exerciceId: string): Promise<CotisationsArrieresData> {
    const exercice = await this.exerciceRepo.findOne({
      where: { id: exerciceId },
      relations: ['tontine', 'membres', 'membres.adhesionTontine', 'membres.adhesionTontine.utilisateur'],
    });
    if (!exercice) throw new NotFoundError(`Exercice non trouvé: ${exerciceId}`);

    const membres = exercice.membres || [];

    const membreDetails = await Promise.all(
      membres.map(async (m) => {
        const u = m.adhesionTontine?.utilisateur;
        const duesRaw = await this.cotisationDueRepo
          .createQueryBuilder('c')
          .select('COALESCE(SUM(c.montantDu), 0)', 'totalDu')
          .addSelect('COALESCE(SUM(c.montantPaye), 0)', 'totalPaye')
          .where('c.exerciceMembreId = :id', { id: m.id })
          .getRawOne<{ totalDu: string; totalPaye: string }>();
        const totalDu = Number(duesRaw?.totalDu ?? 0);
        const totalPaye = Number(duesRaw?.totalPaye ?? 0);
        const arriere = Math.max(0, totalDu - totalPaye);
        return {
          nom: u ? `${u.prenom} ${u.nom}` : 'Inconnu',
          totalDu,
          totalPaye,
          arriere,
          tauxRecouvrement: totalDu > 0 ? Math.round((totalPaye / totalDu) * 100) : 100,
          enDefaut: arriere > 0,
        };
      })
    );

    const totalDuGlobal = membreDetails.reduce((s, m) => s + m.totalDu, 0);
    const totalPayeGlobal = membreDetails.reduce((s, m) => s + m.totalPaye, 0);
    const totalArriere = membreDetails.reduce((s, m) => s + m.arriere, 0);
    const nbMembresEnDefaut = membreDetails.filter((m) => m.enDefaut).length;

    return {
      header: {
        tontineName: exercice.tontine.nom,
        reportTitle: 'Cotisations & Arriérés',
        subtitle: exercice.libelle,
        genereLe: new Date(),
      },
      exercice: { id: exercice.id, annee: exercice.anneeDebut },
      membres: membreDetails,
      totaux: {
        totalDu: totalDuGlobal,
        totalPaye: totalPayeGlobal,
        totalArriere,
        tauxRecouvrementGlobal: totalDuGlobal > 0 ? Math.round((totalPayeGlobal / totalDuGlobal) * 100) : 100,
        nbMembresEnDefaut,
      },
    };
  }

  // =========================================================================
  // RAPPORT 9 — ÉVÉNEMENTS SECOURS
  // =========================================================================

  async exportEvenementsSecours(exerciceId: string, format: ExportFormat): Promise<ExportResult> {
    const strategy = this.strategies.get(format);
    if (!strategy) throw new NotFoundError(`Format d'export non supporté: ${format}`);
    const data = await this.buildEvenementsSecoursData(exerciceId);
    const filename = `secours_exercice_${data.exercice.annee}_${new Date().toISOString().substring(0, 10)}.${strategy.getExtension()}`;
    const buffer = await strategy.genererEvenementsSecours(data);
    return { buffer, filename, contentType: strategy.getContentType() };
  }

  private async buildEvenementsSecoursData(exerciceId: string): Promise<EvenementsSecoursData> {
    const exercice = await this.exerciceRepo.findOne({
      where: { id: exerciceId },
      relations: ['tontine'],
    });
    if (!exercice) throw new NotFoundError(`Exercice non trouvé: ${exerciceId}`);

    const evenements = await this.evenementSecoursRepo.find({
      where: { exerciceMembre: { exerciceId } } as any,
      relations: [
        'exerciceMembre',
        'exerciceMembre.adhesionTontine',
        'exerciceMembre.adhesionTontine.utilisateur',
        'typeEvenementSecours',
        'piecesJustificatives',
      ],
    });

    const evenementsDetail = evenements.map((e) => {
      const u = e.exerciceMembre?.adhesionTontine?.utilisateur;
      return {
        membre: u ? `${u.prenom} ${u.nom}` : 'Inconnu',
        typeEvenement: e.typeEvenementSecours?.libelle || 'N/A',
        date: e.dateEvenement instanceof Date ? e.dateEvenement.toISOString().substring(0, 10) : String(e.dateEvenement),
        montantApprouve: Number(e.montantApprouve ?? 0),
        statut: e.statut,
        nbPiecesJustificatives: e.piecesJustificatives?.length ?? 0,
      };
    });

    const montantTotalDistribue = evenements
      .filter((e) => e.statut === StatutEvenementSecours.PAYE)
      .reduce((s, e) => s + Number(e.montantDecaisse ?? e.montantApprouve ?? 0), 0);

    const enAttente = evenements.filter((e) =>
      [StatutEvenementSecours.DECLARE, StatutEvenementSecours.EN_COURS_VALIDATION].includes(e.statut)
    );
    const montantEnAttente = enAttente.reduce((s, e) => s + Number(e.montantDemande ?? 0), 0);

    return {
      header: {
        tontineName: exercice.tontine.nom,
        reportTitle: 'Événements Secours',
        subtitle: exercice.libelle,
        genereLe: new Date(),
      },
      exercice: { id: exercice.id, annee: exercice.anneeDebut },
      evenements: evenementsDetail,
      kpis: {
        nbEvenements: evenements.length,
        montantTotalDistribue,
        montantEnAttente,
        nbEnAttente: enAttente.length,
      },
    };
  }

  // =========================================================================
  // RAPPORT 10 — BILAN FINANCIER ANNUEL
  // =========================================================================

  async exportBilanFinancierAnnuel(tontineId: string, annee: number, format: ExportFormat): Promise<ExportResult> {
    const strategy = this.strategies.get(format);
    if (!strategy) throw new NotFoundError(`Format d'export non supporté: ${format}`);
    const data = await this.buildBilanFinancierAnnuelData(tontineId, annee);
    const filename = `bilan_${data.tontine.nom.replace(/\s+/g, '_')}_${annee}.${strategy.getExtension()}`;
    const buffer = await strategy.genererBilanFinancierAnnuel(data);
    return { buffer, filename, contentType: strategy.getContentType() };
  }

  private async buildBilanFinancierAnnuelData(tontineId: string, annee: number): Promise<BilanFinancierAnnuelData> {
    const tontine = await this.tontineRepo.findOne({ where: { id: tontineId } });
    if (!tontine) throw new NotFoundError(`Tontine non trouvée: ${tontineId}`);

    const exercices = await this.exerciceRepo.find({
      where: { tontineId },
      order: { anneeDebut: 'ASC' },
    });

    const parExercice = await Promise.all(
      exercices.map(async (ex) => {
        const [cotisations, distributions, pretsDecaisses, pretsRembourses, penalites, secours] = await Promise.all([
          this.txRepo.createQueryBuilder('t').select('COALESCE(SUM(t.montant), 0)', 'v')
            .innerJoin('t.exerciceMembre', 'em').where('em.exerciceId = :id', { id: ex.id })
            .andWhere('t.typeTransaction = :type', { type: TypeTransaction.COTISATION })
            .andWhere('t.statut = :s', { s: StatutTransaction.VALIDE }).getRawOne<{ v: string }>(),
          this.distributionRepo.createQueryBuilder('d').select('COALESCE(SUM(d.montantNet), 0)', 'v')
            .innerJoin('d.reunion', 'r').where('r.exerciceId = :id', { id: ex.id })
            .andWhere('d.statut = :s', { s: StatutDistribution.DISTRIBUEE }).getRawOne<{ v: string }>(),
          this.txRepo.createQueryBuilder('t').select('COALESCE(SUM(t.montant), 0)', 'v')
            .innerJoin('t.exerciceMembre', 'em').where('em.exerciceId = :id', { id: ex.id })
            .andWhere('t.typeTransaction = :type', { type: TypeTransaction.DECAISSEMENT_PRET })
            .andWhere('t.statut = :s', { s: StatutTransaction.VALIDE }).getRawOne<{ v: string }>(),
          this.txRepo.createQueryBuilder('t').select('COALESCE(SUM(t.montant), 0)', 'v')
            .innerJoin('t.exerciceMembre', 'em').where('em.exerciceId = :id', { id: ex.id })
            .andWhere('t.typeTransaction = :type', { type: TypeTransaction.REMBOURSEMENT_PRET })
            .andWhere('t.statut = :s', { s: StatutTransaction.VALIDE }).getRawOne<{ v: string }>(),
          this.penaliteRepo.createQueryBuilder('p').select('COALESCE(SUM(p.montant), 0)', 'v')
            .innerJoin('p.exerciceMembre', 'em').where('em.exerciceId = :id', { id: ex.id })
            .andWhere('p.statut = :s', { s: StatutPenalite.PAYEE }).getRawOne<{ v: string }>(),
          this.txRepo.createQueryBuilder('t').select('COALESCE(SUM(t.montant), 0)', 'v')
            .innerJoin('t.exerciceMembre', 'em').where('em.exerciceId = :id', { id: ex.id })
            .andWhere('t.typeTransaction = :type', { type: TypeTransaction.DEPENSE_SECOURS })
            .andWhere('t.statut = :s', { s: StatutTransaction.VALIDE }).getRawOne<{ v: string }>(),
        ]);

        const c = Number(cotisations?.v ?? 0);
        const d = Number(distributions?.v ?? 0);
        const pd = Number(pretsDecaisses?.v ?? 0);
        const pr = Number(pretsRembourses?.v ?? 0);
        const pen = Number(penalites?.v ?? 0);
        const sec = Number(secours?.v ?? 0);

        return {
          annee: ex.anneeDebut,
          exerciceId: ex.id,
          statut: ex.statut,
          cotisations: c,
          distributions: d,
          pretsDecaisses: pd,
          pretsRembourses: pr,
          penalites: pen,
          secours: sec,
          soldeNet: c + pen + pr - d - pd - sec,
        };
      })
    );

    const totaux = parExercice.reduce(
      (acc, ex) => ({
        cotisations: acc.cotisations + ex.cotisations,
        distributions: acc.distributions + ex.distributions,
        pretsDecaisses: acc.pretsDecaisses + ex.pretsDecaisses,
        pretsRembourses: acc.pretsRembourses + ex.pretsRembourses,
        penalites: acc.penalites + ex.penalites,
        secours: acc.secours + ex.secours,
      }),
      { cotisations: 0, distributions: 0, pretsDecaisses: 0, pretsRembourses: 0, penalites: 0, secours: 0 }
    );

    return {
      header: {
        tontineName: tontine.nom,
        reportTitle: 'Bilan Financier Annuel',
        genereLe: new Date(),
      },
      tontine: { id: tontine.id, nom: tontine.nom },
      annee,
      parExercice,
      totaux,
    };
  }

  // =========================================================================
  // UTILITAIRES
  // =========================================================================

  private formatTypeTransaction(type: TypeTransaction): string {
    const map: Record<TypeTransaction, string> = {
      [TypeTransaction.INSCRIPTION]: 'Inscription',
      [TypeTransaction.COTISATION]: 'Cotisation',
      [TypeTransaction.EPARGNE]: 'Épargne',
      [TypeTransaction.POT]: 'Pot',
      [TypeTransaction.SECOURS]: 'Secours',
      [TypeTransaction.DECAISSEMENT_PRET]: 'Décaissement prêt',
      [TypeTransaction.REMBOURSEMENT_PRET]: 'Remboursement prêt',
      [TypeTransaction.DEPENSE_SECOURS]: 'Dépense secours',
      [TypeTransaction.PENALITE]: 'Pénalité',
      [TypeTransaction.PROJET]: 'Projet',
      [TypeTransaction.AUTRE]: 'Autre',
    };
    return map[type] || type;
  }
}

export const exportService = new ExportService();
