/**
 * Service d'export principal (orchestrateur)
 * Agrège les données depuis la base et délègue la génération au service PDF ou Excel
 */

import { Repository } from 'typeorm';
import { AppDataSource } from '../../../config';
import { NotFoundError } from '../../../shared';

import { ExerciceMembre } from '../../exercices/entities/exercice-membre.entity';
import { Exercice } from '../../exercices/entities/exercice.entity';
import { Transaction, TypeTransaction, StatutTransaction } from '../../transactions/entities/transaction.entity';
import { Pret, StatutPret } from '../../prets/entities/pret.entity';
import { Reunion } from '../../reunions/entities/reunion.entity';
import { CotisationDueMensuelle } from '../../transactions/entities/cotisation-due-mensuelle.entity';
import { Penalite, StatutPenalite } from '../../penalites/entities/penalite.entity';
import { RemboursementPret } from '../../prets/entities/remboursement-pret.entity';
import { Distribution, StatutDistribution } from '../../distributions/entities/distribution.entity';

import { pdfExportService, ReleveCompteData, RapportExerciceData, RapportMensuelData } from './pdf-export.service';
import { excelExportService } from './excel-export.service';

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
    // Repositories lazy
    private get emRepo(): Repository<ExerciceMembre> { return AppDataSource.getRepository(ExerciceMembre); }
    private get exerciceRepo(): Repository<Exercice> { return AppDataSource.getRepository(Exercice); }
    private get txRepo(): Repository<Transaction> { return AppDataSource.getRepository(Transaction); }
    private get pretRepo(): Repository<Pret> { return AppDataSource.getRepository(Pret); }
    private get reunionRepo(): Repository<Reunion> { return AppDataSource.getRepository(Reunion); }
    private get cotisationDueRepo(): Repository<CotisationDueMensuelle> { return AppDataSource.getRepository(CotisationDueMensuelle); }
    private get penaliteRepo(): Repository<Penalite> { return AppDataSource.getRepository(Penalite); }
    private get remboursementRepo(): Repository<RemboursementPret> { return AppDataSource.getRepository(RemboursementPret); }
    private get distributionRepo(): Repository<Distribution> { return AppDataSource.getRepository(Distribution); }

    // =========================================================================
    // RELEVÉ DE COMPTE INDIVIDUEL
    // =========================================================================

    async exportReleveCompte(exerciceMembreId: string, format: ExportFormat): Promise<ExportResult> {
        const data = await this.buildReleveCompteData(exerciceMembreId);

        const nomMembre = data.membre.nom.replace(/\s+/g, '_');
        const ext = format === 'pdf' ? 'pdf' : 'xlsx';
        const filename = `releve_${nomMembre}_${new Date().toISOString().substring(0, 10)}.${ext}`;

        let buffer: Buffer;
        if (format === 'pdf') {
            buffer = await pdfExportService.genererReleveCompte(data);
        } else {
            buffer = await excelExportService.genererReleveCompte(data);
        }

        return {
            buffer,
            filename,
            contentType: format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        };
    }

    private async buildReleveCompteData(exerciceMembreId: string): Promise<ReleveCompteData> {
        const membre = await this.emRepo.findOne({
            where: { id: exerciceMembreId },
            relations: [
                'adhesionTontine', 'adhesionTontine.utilisateur',
                'exercice', 'exercice.tontine',
            ],
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
        const txRows = transactions.map(tx => {
            const montant = Number(tx.montant);
            const isCredit = [TypeTransaction.DECAISSEMENT_PRET, TypeTransaction.DEPENSE_SECOURS, TypeTransaction.POT].includes(tx.typeTransaction);
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
        const totalCotise = transactions.filter(t => t.typeTransaction === TypeTransaction.COTISATION)
            .reduce((sum, t) => sum + Number(t.montant), 0);
        const totalEpargne = transactions.filter(t => t.typeTransaction === TypeTransaction.EPARGNE)
            .reduce((sum, t) => sum + Number(t.montant), 0);
        const totalSecours = transactions.filter(t => t.typeTransaction === TypeTransaction.SECOURS)
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
            pret: pretActif ? {
                montantCapital: Number(pretActif.montantCapital),
                capitalRestant: Number(pretActif.capitalRestant),
                tauxInteret: Number(pretActif.tauxInteret),
                dateDecaissement: pretActif.dateDecaissement ? pretActif.dateDecaissement.toISOString().substring(0, 10) : 'N/A',
                dateEcheance: pretActif.dateEcheance ? pretActif.dateEcheance.toISOString().substring(0, 10) : 'N/A',
                statut: pretActif.statut,
            } : null,
        };
    }

    // =========================================================================
    // RAPPORT DE FIN D'EXERCICE
    // =========================================================================

    async exportRapportExercice(exerciceId: string, format: ExportFormat): Promise<ExportResult> {
        const data = await this.buildRapportExerciceData(exerciceId);

        const ext = format === 'pdf' ? 'pdf' : 'xlsx';
        const filename = `rapport_exercice_${new Date().toISOString().substring(0, 10)}.${ext}`;

        let buffer: Buffer;
        if (format === 'pdf') {
            buffer = await pdfExportService.genererRapportExercice(data);
        } else {
            buffer = await excelExportService.genererRapportExercice(data);
        }

        return { buffer, filename, contentType: format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' };
    }

    private async buildRapportExerciceData(exerciceId: string): Promise<RapportExerciceData> {
        const exercice = await this.exerciceRepo.findOne({
            where: { id: exerciceId },
            relations: ['tontine', 'membres', 'membres.adhesionTontine', 'membres.adhesionTontine.utilisateur'],
        });

        if (!exercice) throw new NotFoundError(`Exercice non trouvé: ${exerciceId}`);

        const tontine = exercice.tontine;
        const membres = exercice.membres || [];

        // Totaux globaux via SQL
        const [totalCotisationsRaw, totalDistribRaw, totalPretsRaw, totalPenalitesRaw, totalSecoursRaw, totalEpargneRaw] = await Promise.all([
            this.txRepo.createQueryBuilder('t')
                .select('COALESCE(SUM(t.montant), 0)', 'total')
                .innerJoin('t.exerciceMembre', 'em')
                .where('em.exerciceId = :exerciceId', { exerciceId })
                .andWhere('t.typeTransaction = :type', { type: TypeTransaction.COTISATION })
                .andWhere('t.statut = :statut', { statut: StatutTransaction.VALIDE })
                .getRawOne<{ total: string }>(),
            this.distributionRepo.createQueryBuilder('d')
                .select('COALESCE(SUM(d.montantNet), 0)', 'total')
                .innerJoin('d.reunion', 'r')
                .where('r.exerciceId = :exerciceId', { exerciceId })
                .andWhere('d.statut = :statut', { statut: StatutDistribution.DISTRIBUEE })
                .getRawOne<{ total: string }>(),
            this.pretRepo.createQueryBuilder('p')
                .select('COALESCE(SUM(p.montantCapital), 0)', 'total')
                .innerJoin('p.exerciceMembre', 'em')
                .where('em.exerciceId = :exerciceId', { exerciceId })
                .getRawOne<{ total: string }>(),
            this.penaliteRepo.createQueryBuilder('p')
                .select('COALESCE(SUM(p.montant), 0)', 'total')
                .innerJoin('p.exerciceMembre', 'em')
                .where('em.exerciceId = :exerciceId', { exerciceId })
                .andWhere('p.statut = :statut', { statut: StatutPenalite.PAYEE })
                .getRawOne<{ total: string }>(),
            this.txRepo.createQueryBuilder('t')
                .select('COALESCE(SUM(t.montant), 0)', 'total')
                .innerJoin('t.exerciceMembre', 'em')
                .where('em.exerciceId = :exerciceId', { exerciceId })
                .andWhere('t.typeTransaction = :type', { type: TypeTransaction.DEPENSE_SECOURS })
                .andWhere('t.statut = :statut', { statut: StatutTransaction.VALIDE })
                .getRawOne<{ total: string }>(),
            this.txRepo.createQueryBuilder('t')
                .select('COALESCE(SUM(t.montant), 0)', 'total')
                .innerJoin('t.exerciceMembre', 'em')
                .where('em.exerciceId = :exerciceId', { exerciceId })
                .andWhere('t.typeTransaction = :type', { type: TypeTransaction.EPARGNE })
                .andWhere('t.statut = :statut', { statut: StatutTransaction.VALIDE })
                .getRawOne<{ total: string }>(),
        ]);

        // Détail par membre
        const membresDetail = await Promise.all(membres.map(async (m) => {
            const utilisateur = m.adhesionTontine?.utilisateur;
            const nom = utilisateur ? `${utilisateur.prenom} ${utilisateur.nom}` : 'Inconnu';
            const cotise = await this.txRepo.createQueryBuilder('t')
                .select('COALESCE(SUM(t.montant), 0)', 'total')
                .where('t.exerciceMembreId = :id', { id: m.id })
                .andWhere('t.typeTransaction = :type', { type: TypeTransaction.COTISATION })
                .andWhere('t.statut = :statut', { statut: StatutTransaction.VALIDE })
                .getRawOne<{ total: string }>();
            const distribRaw = await this.distributionRepo.createQueryBuilder('d')
                .select('COALESCE(SUM(d.montantNet), 0)', 'total')
                .where('d.exerciceMembreBeneficiaireId = :id', { id: m.id })
                .andWhere('d.statut = :statut', { statut: StatutDistribution.DISTRIBUEE })
                .getRawOne<{ total: string }>();
            const dettesRaw = await this.cotisationDueRepo.createQueryBuilder('c')
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
        }));

        // Réunions
        const reunions = await this.reunionRepo.find({
            where: { exerciceId },
            order: { dateReunion: 'ASC' },
        });

        const reunionsDetail = await Promise.all(reunions.map(async (r, i) => {
            const distrib = await this.distributionRepo.findOne({
                where: { reunionId: r.id, statut: StatutDistribution.DISTRIBUEE },
                relations: ['exerciceMembreBeneficiaire', 'exerciceMembreBeneficiaire.adhesionTontine', 'exerciceMembreBeneficiaire.adhesionTontine.utilisateur'],
            });
            const u = distrib?.exerciceMembreBeneficiaire?.adhesionTontine?.utilisateur;

            return {
                numero: i + 1,
                date: r.dateReunion instanceof Date ? r.dateReunion.toISOString() : String(r.dateReunion),
                lieu: r.lieu || '',
                beneficiaire: u ? `${u.prenom} ${u.nom}` : (distrib ? 'N/A' : 'Aucun'),
                montantDistribue: distrib ? Number(distrib.montantNet) : 0,
                statut: r.statut,
            };
        }));

        const dateDebut = new Date(exercice.anneeDebut, exercice.moisDebut - 1, 1);
        const dateFin = new Date(exercice.anneeFin, exercice.moisFin - 1, 30);

        return {
            header: {
                tontineName: tontine.nom,
                reportTitle: 'Rapport de Fin d\'Exercice',
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
        const data = await this.buildRapportMensuelData(reunionId);

        const ext = format === 'pdf' ? 'pdf' : 'xlsx';
        const filename = `rapport_reunion_${data.reunion.numero}_${new Date().toISOString().substring(0, 10)}.${ext}`;

        let buffer: Buffer;
        if (format === 'pdf') {
            buffer = await pdfExportService.genererRapportMensuel(data);
        } else {
            buffer = await excelExportService.genererRapportMensuel(data);
        }

        return { buffer, filename, contentType: format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' };
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
        const reunionNumero = allReunions.findIndex(r => r.id === reunionId) + 1;

        // Bénéficiaire
        const distrib = await this.distributionRepo.findOne({
            where: { reunionId },
            relations: ['exerciceMembreBeneficiaire', 'exerciceMembreBeneficiaire.adhesionTontine', 'exerciceMembreBeneficiaire.adhesionTontine.utilisateur'],
        });
        const benefUser = distrib?.exerciceMembreBeneficiaire?.adhesionTontine?.utilisateur;

        // Cotisations
        const cotisations = await this.cotisationDueRepo.find({
            where: { reunionId },
            relations: ['exerciceMembre', 'exerciceMembre.adhesionTontine', 'exerciceMembre.adhesionTontine.utilisateur'],
        });

        // Remboursements de prêts
        const remboursements = await this.remboursementRepo.find({
            where: { reunionId },
            relations: ['pret', 'pret.exerciceMembre', 'pret.exerciceMembre.adhesionTontine', 'pret.exerciceMembre.adhesionTontine.utilisateur'],
        });

        // Pénalités
        const penalites = await this.penaliteRepo.find({
            where: { reunionId },
            relations: ['exerciceMembre', 'exerciceMembre.adhesionTontine', 'exerciceMembre.adhesionTontine.utilisateur', 'typePenalite'],
        });

        const totalCotisations = cotisations.reduce((sum, c) => sum + Number(c.montantPaye), 0);
        const totalRemboursements = remboursements.reduce((sum, r) => sum + Number(r.montantTotal), 0);
        const totalPenalites = penalites.filter(p => p.statut === StatutPenalite.PAYEE).reduce((sum, p) => sum + Number(p.montant), 0);

        return {
            header: {
                tontineName: tontine.nom,
                reportTitle: `Rapport Réunion N°${reunionNumero}`,
                subtitle: exercice.libelle,
                periode: reunion.dateReunion instanceof Date ? reunion.dateReunion.toLocaleDateString('fr-FR') : String(reunion.dateReunion),
                genereLe: new Date(),
            },
            reunion: {
                numero: reunionNumero,
                date: reunion.dateReunion instanceof Date ? reunion.dateReunion.toISOString() : String(reunion.dateReunion),
                lieu: reunion.lieu || '',
                beneficiaire: benefUser ? `${benefUser.prenom} ${benefUser.nom}` : 'N/A',
                montantDistribue: distrib ? Number(distrib.montantNet) : 0,
            },
            cotisations: cotisations.map(c => {
                const u = c.exerciceMembre?.adhesionTontine?.utilisateur;
                return {
                    membre: u ? `${u.prenom} ${u.nom}` : 'Inconnu',
                    montantDu: Number(c.montantDu),
                    montantPaye: Number(c.montantPaye),
                    soldeRestant: Number(c.soldeRestant),
                    statut: c.statut,
                };
            }),
            prets: remboursements.map(r => {
                const u = r.pret?.exerciceMembre?.adhesionTontine?.utilisateur;
                return {
                    membre: u ? `${u.prenom} ${u.nom}` : 'Inconnu',
                    montantRembourse: Number(r.montantTotal),
                    capitalRestant: Number(r.capitalRestantApres),
                };
            }),
            penalites: penalites.map(p => {
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
