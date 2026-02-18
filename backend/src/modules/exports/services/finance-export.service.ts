/**
 * Service d'export des rapports financiers en PDF
 */

import { Repository } from 'typeorm';
import { AppDataSource } from '../../../config';
import { NotFoundError } from '../../../shared';
import { Transaction, TypeTransaction, StatutTransaction } from '../../transactions/entities/transaction.entity';
import { Exercice } from '../../exercices/entities/exercice.entity';
import { Pret, StatutPret } from '../../prets/entities/pret.entity';
import { Penalite, StatutPenalite } from '../../penalites/entities/penalite.entity';
import { createPDFService, TableColumn } from './pdf.service';

/**
 * Formater une date de manière sécurisée
 */
function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '-';
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('fr-FR');
}

export class FinanceExportService {
  private _transactionRepo?: Repository<Transaction>;
  private _exerciceRepo?: Repository<Exercice>;
  private _pretRepo?: Repository<Pret>;
  private _penaliteRepo?: Repository<Penalite>;

  private get transactionRepository(): Repository<Transaction> {
    if (!this._transactionRepo) this._transactionRepo = AppDataSource.getRepository(Transaction);
    return this._transactionRepo;
  }

  private get exerciceRepository(): Repository<Exercice> {
    if (!this._exerciceRepo) this._exerciceRepo = AppDataSource.getRepository(Exercice);
    return this._exerciceRepo;
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
   * Exporter le rapport financier d'un exercice
   */
  async exportRapportFinancier(exerciceId: string): Promise<Buffer> {
    const exercice = await this.exerciceRepository.findOne({
      where: { id: exerciceId },
      relations: ['tontine', 'reunions'],
    });

    if (!exercice) {
      throw new NotFoundError(`Exercice non trouvé: ${exerciceId}`);
    }

    // Récupérer les transactions via les réunions
    const reunionIds = exercice.reunions?.map(r => r.id) || [];
    let transactions: Transaction[] = [];

    if (reunionIds.length > 0) {
      transactions = await this.transactionRepository
        .createQueryBuilder('t')
        .leftJoinAndSelect('t.exerciceMembre', 'em')
        .leftJoinAndSelect('em.adhesionTontine', 'at')
        .leftJoinAndSelect('at.utilisateur', 'u')
        .where('t.reunionId IN (:...reunionIds)', { reunionIds })
        .orderBy('t.creeLe', 'ASC')
        .getMany();
    }

    const pdf = createPDFService({
      title: 'Rapport Financier',
      subtitle: `${exercice.tontine?.nom} - ${exercice.libelle}`,
      author: 'Nkapay',
      orientation: 'landscape',
    });

    pdf.addHeader();

    // Période
    const dateDebut = `${exercice.moisDebut}/${exercice.anneeDebut}`;
    const dateFin = `${exercice.moisFin}/${exercice.anneeFin}`;

    pdf.addSectionTitle('Période du Rapport');
    pdf.addKeyValue('Exercice', exercice.libelle);
    pdf.addKeyValue('Période', `${dateDebut} - ${dateFin}`);

    pdf.addSpace();

    // Calculs financiers
    const transactionsValidees = transactions.filter(t => t.statut === StatutTransaction.VALIDE);

    const cotisations = transactionsValidees.filter(t => t.typeTransaction === TypeTransaction.COTISATION);
    const pots = transactionsValidees.filter(t => t.typeTransaction === TypeTransaction.POT);
    const pretsDecaisses = transactionsValidees.filter(t => t.typeTransaction === TypeTransaction.DECAISSEMENT_PRET);
    const remboursements = transactionsValidees.filter(t => t.typeTransaction === TypeTransaction.REMBOURSEMENT_PRET);
    const penalites = transactionsValidees.filter(t => t.typeTransaction === TypeTransaction.PENALITE);
    const inscriptions = transactionsValidees.filter(t => t.typeTransaction === TypeTransaction.INSCRIPTION);

    const totalCotisations = cotisations.reduce((sum, t) => sum + Number(t.montant), 0);
    const totalPots = pots.reduce((sum, t) => sum + Number(t.montant), 0);
    const totalPrets = pretsDecaisses.reduce((sum, t) => sum + Number(t.montant), 0);
    const totalRemboursements = remboursements.reduce((sum, t) => sum + Number(t.montant), 0);
    const totalPenalites = penalites.reduce((sum, t) => sum + Number(t.montant), 0);
    const totalInscriptions = inscriptions.reduce((sum, t) => sum + Number(t.montant), 0);

    const totalEntrees = totalCotisations + totalRemboursements + totalPenalites + totalInscriptions;
    const totalSorties = totalPots + totalPrets;
    const solde = totalEntrees - totalSorties;

    // Résumé financier
    pdf.addSummaryBoxes([
      {
        title: 'Entrées',
        items: [
          { label: 'Cotisations', value: `${totalCotisations.toLocaleString('fr-FR')} FCFA` },
          { label: 'Inscriptions', value: `${totalInscriptions.toLocaleString('fr-FR')} FCFA` },
          { label: 'Remboursements', value: `${totalRemboursements.toLocaleString('fr-FR')} FCFA` },
          { label: 'Pénalités', value: `${totalPenalites.toLocaleString('fr-FR')} FCFA` },
          { label: 'Total Entrées', value: `${totalEntrees.toLocaleString('fr-FR')} FCFA`, highlight: true },
        ],
      },
      {
        title: 'Sorties',
        items: [
          { label: 'Pots distribués', value: `${totalPots.toLocaleString('fr-FR')} FCFA` },
          { label: 'Prêts décaissés', value: `${totalPrets.toLocaleString('fr-FR')} FCFA` },
          { label: 'Total Sorties', value: `${totalSorties.toLocaleString('fr-FR')} FCFA`, highlight: true },
        ],
      },
      {
        title: 'Bilan',
        items: [
          { label: 'Solde', value: `${solde.toLocaleString('fr-FR')} FCFA`, highlight: solde >= 0 },
          { label: 'Transactions', value: transactionsValidees.length.toString() },
        ],
      },
    ]);

    // Détail des transactions
    if (transactions.length > 0) {
      pdf.addSectionTitle('Détail des Transactions');

      const columns: TableColumn[] = [
        { header: 'Date', field: 'date', width: 80 },
        { header: 'Référence', field: 'reference', width: 100 },
        { header: 'Type', field: 'type', width: 100 },
        { header: 'Membre', field: 'membre', width: 150 },
        { header: 'Description', field: 'description', width: 150 },
        { header: 'Montant', field: 'montant', width: 100, align: 'right' },
        { header: 'Statut', field: 'statut', width: 80 },
      ];

      const data = transactions.map(t => ({
        date: formatDate(t.creeLe),
        reference: t.reference || '-',
        type: this.formatTypeTransaction(t.typeTransaction),
        membre: t.exerciceMembre?.adhesionTontine?.utilisateur?.nom || '-',
        description: t.description || '-',
        montant: `${Number(t.montant).toLocaleString('fr-FR')} FCFA`,
        statut: t.statut,
      }));

      pdf.addTable(columns, data);
    }

    return pdf.generateBuffer();
  }

  /**
   * Exporter le relevé d'un membre
   */
  async exportReleveMembre(exerciceId: string, membreId: string): Promise<Buffer> {
    const exercice = await this.exerciceRepository.findOne({
      where: { id: exerciceId },
      relations: ['tontine', 'membres', 'membres.adhesionTontine', 'membres.adhesionTontine.utilisateur'],
    });

    if (!exercice) {
      throw new NotFoundError(`Exercice non trouvé: ${exerciceId}`);
    }

    const exerciceMembre = exercice.membres?.find(
      em => em.adhesionTontine?.utilisateur?.id === membreId
    );

    if (!exerciceMembre) {
      throw new NotFoundError(`Membre non trouvé dans cet exercice`);
    }

    const transactions = await this.transactionRepository.find({
      where: { exerciceMembreId: exerciceMembre.id },
      order: { creeLe: 'ASC' },
    });

    const membre = exerciceMembre.adhesionTontine?.utilisateur;

    const pdf = createPDFService({
      title: 'Relevé de Compte Membre',
      subtitle: membre?.nom || 'Membre',
      author: 'Nkapay',
    });

    pdf.addHeader();

    // Informations membre
    pdf.addSectionTitle('Informations du Membre');
    pdf.addKeyValue('Nom', membre?.nom || '-');
    pdf.addKeyValue('Téléphone', membre?.telephone1 || '-');
    pdf.addKeyValue('Tontine', exercice.tontine?.nom || '-');
    pdf.addKeyValue('Exercice', exercice.libelle);

    pdf.addSpace();

    // Calculs
    const cotisationsPayees = transactions
      .filter(t => t.typeTransaction === TypeTransaction.COTISATION && t.statut === StatutTransaction.VALIDE)
      .reduce((sum, t) => sum + Number(t.montant), 0);

    const penalitesPayees = transactions
      .filter(t => t.typeTransaction === TypeTransaction.PENALITE && t.statut === StatutTransaction.VALIDE)
      .reduce((sum, t) => sum + Number(t.montant), 0);

    const potsRecus = transactions
      .filter(t => t.typeTransaction === TypeTransaction.POT && t.statut === StatutTransaction.VALIDE)
      .reduce((sum, t) => sum + Number(t.montant), 0);

    pdf.addSummaryBoxes([
      {
        title: 'Cotisations',
        items: [
          { label: 'Payées', value: `${cotisationsPayees.toLocaleString('fr-FR')} FCFA`, highlight: true },
        ],
      },
      {
        title: 'Autres',
        items: [
          { label: 'Pots reçus', value: `${potsRecus.toLocaleString('fr-FR')} FCFA` },
          { label: 'Pénalités payées', value: `${penalitesPayees.toLocaleString('fr-FR')} FCFA` },
          { label: 'Transactions', value: transactions.length.toString() },
        ],
      },
    ]);

    // Historique des transactions
    if (transactions.length > 0) {
      pdf.addSectionTitle('Historique des Transactions');

      const columns: TableColumn[] = [
        { header: 'Date', field: 'date', width: 100 },
        { header: 'Type', field: 'type', width: 120 },
        { header: 'Référence', field: 'reference', width: 120 },
        { header: 'Description', field: 'description', width: 180 },
        { header: 'Montant', field: 'montant', width: 120, align: 'right' },
        { header: 'Statut', field: 'statut', width: 100 },
      ];

      const data = transactions.map(t => ({
        date: formatDate(t.creeLe),
        type: this.formatTypeTransaction(t.typeTransaction),
        reference: t.reference || '-',
        description: t.description || '-',
        montant: `${Number(t.montant).toLocaleString('fr-FR')} FCFA`,
        statut: t.statut,
      }));

      pdf.addTable(columns, data);
    }

    return pdf.generateBuffer();
  }

  /**
   * Exporter le rapport des prêts
   */
  async exportRapportPrets(exerciceId: string): Promise<Buffer> {
    const exercice = await this.exerciceRepository.findOne({
      where: { id: exerciceId },
      relations: ['tontine', 'reunions'],
    });

    if (!exercice) {
      throw new NotFoundError(`Exercice non trouvé: ${exerciceId}`);
    }

    const reunionIds = exercice.reunions?.map(r => r.id) || [];
    let prets: Pret[] = [];

    if (reunionIds.length > 0) {
      prets = await this.pretRepository
        .createQueryBuilder('p')
        .leftJoinAndSelect('p.exerciceMembre', 'em')
        .leftJoinAndSelect('em.adhesionTontine', 'at')
        .leftJoinAndSelect('at.utilisateur', 'u')
        .leftJoinAndSelect('p.remboursements', 'r')
        .where('p.reunionId IN (:...reunionIds)', { reunionIds })
        .orderBy('p.dateDemande', 'ASC')
        .getMany();
    }

    const pdf = createPDFService({
      title: 'Rapport des Prêts',
      subtitle: `${exercice.tontine?.nom} - ${exercice.libelle}`,
      author: 'Nkapay',
      orientation: 'landscape',
    });

    pdf.addHeader();

    // Statistiques des prêts
    const pretsApprouves = prets.filter(p =>
      p.statut === StatutPret.APPROUVE ||
      p.statut === StatutPret.DECAISSE ||
      p.statut === StatutPret.EN_COURS ||
      p.statut === StatutPret.SOLDE
    );
    const pretsEnCours = prets.filter(p => p.statut === StatutPret.EN_COURS);
    const pretsSoldes = prets.filter(p => p.statut === StatutPret.SOLDE);

    const totalAccorde = pretsApprouves.reduce((sum, p) => sum + Number(p.montantCapital), 0);
    const totalEnCours = pretsEnCours.reduce((sum, p) => sum + Number(p.capitalRestant || 0), 0);
    const totalInterets = pretsApprouves.reduce((sum, p) => sum + Number(p.montantInteret || 0), 0);

    pdf.addSummaryBoxes([
      {
        title: 'Prêts',
        items: [
          { label: 'Total demandes', value: prets.length.toString() },
          { label: 'Approuvés', value: pretsApprouves.length.toString(), highlight: true },
          { label: 'En cours', value: pretsEnCours.length.toString() },
          { label: 'Soldés', value: pretsSoldes.length.toString() },
        ],
      },
      {
        title: 'Montants',
        items: [
          { label: 'Total accordé', value: `${totalAccorde.toLocaleString('fr-FR')} FCFA` },
          { label: 'Reste à rembourser', value: `${totalEnCours.toLocaleString('fr-FR')} FCFA`, highlight: true },
          { label: 'Intérêts générés', value: `${totalInterets.toLocaleString('fr-FR')} FCFA` },
        ],
      },
    ]);

    // Liste des prêts
    if (prets.length > 0) {
      pdf.addSectionTitle('Liste des Prêts');

      const columns: TableColumn[] = [
        { header: 'Date demande', field: 'dateDemande', width: 90 },
        { header: 'Membre', field: 'membre', width: 150 },
        { header: 'Capital', field: 'capital', width: 100, align: 'right' },
        { header: 'Taux', field: 'taux', width: 60, align: 'center' },
        { header: 'Intérêts', field: 'interets', width: 90, align: 'right' },
        { header: 'Total dû', field: 'totalDu', width: 100, align: 'right' },
        { header: 'Reste', field: 'reste', width: 100, align: 'right' },
        { header: 'Échéance', field: 'echeance', width: 90 },
        { header: 'Statut', field: 'statut', width: 80 },
      ];

      const data = prets.map(p => ({
        dateDemande: formatDate(p.dateDemande),
        membre: p.exerciceMembre?.adhesionTontine?.utilisateur?.nom || '-',
        capital: `${Number(p.montantCapital).toLocaleString('fr-FR')} FCFA`,
        taux: `${Number(p.tauxInteret || 0) * 100}%`,
        interets: `${Number(p.montantInteret || 0).toLocaleString('fr-FR')} FCFA`,
        totalDu: `${Number(p.montantTotalDu).toLocaleString('fr-FR')} FCFA`,
        reste: `${Number(p.capitalRestant || 0).toLocaleString('fr-FR')} FCFA`,
        echeance: formatDate(p.dateEcheance),
        statut: p.statut,
      }));

      pdf.addTable(columns, data);
    }

    return pdf.generateBuffer();
  }

  /**
   * Exporter le rapport des pénalités
   */
  async exportRapportPenalites(exerciceId: string): Promise<Buffer> {
    const exercice = await this.exerciceRepository.findOne({
      where: { id: exerciceId },
      relations: ['tontine', 'membres'],
    });

    if (!exercice) {
      throw new NotFoundError(`Exercice non trouvé: ${exerciceId}`);
    }

    const exerciceMembreIds = exercice.membres?.map(m => m.id) || [];
    let penalites: Penalite[] = [];

    if (exerciceMembreIds.length > 0) {
      penalites = await this.penaliteRepository
        .createQueryBuilder('p')
        .leftJoinAndSelect('p.exerciceMembre', 'em')
        .leftJoinAndSelect('em.adhesionTontine', 'at')
        .leftJoinAndSelect('at.utilisateur', 'u')
        .leftJoinAndSelect('p.reunion', 'r')
        .leftJoinAndSelect('p.typePenalite', 'tp')
        .where('p.exerciceMembreId IN (:...exerciceMembreIds)', { exerciceMembreIds })
        .orderBy('p.dateApplication', 'ASC')
        .getMany();
    }

    const pdf = createPDFService({
      title: 'Rapport des Pénalités',
      subtitle: `${exercice.tontine?.nom} - ${exercice.libelle}`,
      author: 'Nkapay',
    });

    pdf.addHeader();

    // Statistiques
    const penalitesPayees = penalites.filter(p => p.statut === StatutPenalite.PAYEE);
    const penalitesEnAttente = penalites.filter(p => p.statut === StatutPenalite.EN_ATTENTE);
    const penalitesPardonnees = penalites.filter(p => p.statut === StatutPenalite.PARDONNEE);

    const totalDu = penalites.reduce((sum, p) => sum + Number(p.montant), 0);
    const totalPaye = penalitesPayees.reduce((sum, p) => sum + Number(p.montant), 0);
    const totalEnAttente = penalitesEnAttente.reduce((sum, p) => sum + Number(p.montant), 0);

    pdf.addSummaryBoxes([
      {
        title: 'Pénalités',
        items: [
          { label: 'Total', value: penalites.length.toString() },
          { label: 'Payées', value: penalitesPayees.length.toString(), highlight: true },
          { label: 'En attente', value: penalitesEnAttente.length.toString() },
          { label: 'Pardonnées', value: penalitesPardonnees.length.toString() },
        ],
      },
      {
        title: 'Montants',
        items: [
          { label: 'Total dû', value: `${totalDu.toLocaleString('fr-FR')} FCFA` },
          { label: 'Payé', value: `${totalPaye.toLocaleString('fr-FR')} FCFA`, highlight: true },
          { label: 'En attente', value: `${totalEnAttente.toLocaleString('fr-FR')} FCFA` },
        ],
      },
    ]);

    // Liste des pénalités
    if (penalites.length > 0) {
      pdf.addSectionTitle('Liste des Pénalités');

      const columns: TableColumn[] = [
        { header: 'Date', field: 'date', width: 90 },
        { header: 'Membre', field: 'membre', width: 150 },
        { header: 'Type', field: 'type', width: 120 },
        { header: 'Réunion', field: 'reunion', width: 80, align: 'center' },
        { header: 'Montant', field: 'montant', width: 100, align: 'right' },
        { header: 'Statut', field: 'statut', width: 90 },
      ];

      const data = penalites.map(p => ({
        date: formatDate(p.dateApplication),
        membre: p.exerciceMembre?.adhesionTontine?.utilisateur?.nom || '-',
        type: p.typePenalite?.libelle || '-',
        reunion: p.reunion ? `N°${p.reunion.numeroReunion}` : '-',
        montant: `${Number(p.montant).toLocaleString('fr-FR')} FCFA`,
        statut: p.statut,
      }));

      pdf.addTable(columns, data);
    }

    return pdf.generateBuffer();
  }

  /**
   * Formater le type de transaction pour affichage
   */
  private formatTypeTransaction(type: TypeTransaction): string {
    const labels: Record<TypeTransaction, string> = {
      [TypeTransaction.INSCRIPTION]: 'Inscription',
      [TypeTransaction.COTISATION]: 'Cotisation',
      [TypeTransaction.POT]: 'Pot',
      [TypeTransaction.SECOURS]: 'Secours',
      [TypeTransaction.EPARGNE]: 'Épargne',
      [TypeTransaction.DECAISSEMENT_PRET]: 'Décaissement prêt',
      [TypeTransaction.REMBOURSEMENT_PRET]: 'Remboursement',
      [TypeTransaction.DEPENSE_SECOURS]: 'Dépense secours',
      [TypeTransaction.PENALITE]: 'Pénalité',
      [TypeTransaction.PROJET]: 'Projet',
      [TypeTransaction.AUTRE]: 'Autre',
    };
    return labels[type] || type;
  }
}

export const financeExportService = new FinanceExportService();
