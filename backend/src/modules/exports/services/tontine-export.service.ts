/**
 * Service d'export des rapports de tontine en PDF
 */

import { Repository } from 'typeorm';
import { AppDataSource } from '../../../config';
import { NotFoundError } from '../../../shared';
import { Tontine } from '../../tontines/entities/tontine.entity';
import { AdhesionTontine, StatutAdhesion } from '../../tontines/entities/adhesion-tontine.entity';
import { Exercice, StatutExercice } from '../../exercices/entities/exercice.entity';
import { Reunion, StatutReunion } from '../../reunions/entities/reunion.entity';
import { Transaction, TypeTransaction, StatutTransaction } from '../../transactions/entities/transaction.entity';
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

export class TontineExportService {
  private _tontineRepo?: Repository<Tontine>;
  private _exerciceRepo?: Repository<Exercice>;
  private _reunionRepo?: Repository<Reunion>;
  private _transactionRepo?: Repository<Transaction>;

  private get tontineRepository(): Repository<Tontine> {
    if (!this._tontineRepo) this._tontineRepo = AppDataSource.getRepository(Tontine);
    return this._tontineRepo;
  }

  private get exerciceRepository(): Repository<Exercice> {
    if (!this._exerciceRepo) this._exerciceRepo = AppDataSource.getRepository(Exercice);
    return this._exerciceRepo;
  }

  private get reunionRepository(): Repository<Reunion> {
    if (!this._reunionRepo) this._reunionRepo = AppDataSource.getRepository(Reunion);
    return this._reunionRepo;
  }

  private get transactionRepository(): Repository<Transaction> {
    if (!this._transactionRepo) this._transactionRepo = AppDataSource.getRepository(Transaction);
    return this._transactionRepo;
  }

  /**
   * Exporter la fiche d'une tontine
   */
  async exportTontineFiche(tontineId: string): Promise<Buffer> {
    const tontine = await this.tontineRepository.findOne({
      where: { id: tontineId },
      relations: ['tontineType', 'adhesions', 'adhesions.utilisateur', 'exercices'],
    });

    if (!tontine) {
      throw new NotFoundError(`Tontine non trouvée: ${tontineId}`);
    }

    const pdf = createPDFService({
      title: `Fiche Tontine: ${tontine.nom}`,
      subtitle: tontine.nomCourt,
      author: 'Nkapay',
    });

    pdf.addHeader();

    // Informations générales
    pdf.addSectionTitle('Informations Générales');
    pdf.addKeyValue('Nom complet', tontine.nom);
    pdf.addKeyValue('Nom court', tontine.nomCourt);
    pdf.addKeyValue('Type', tontine.tontineType?.libelle || '-');
    pdf.addKeyValue('Statut', tontine.statut);
    pdf.addKeyValue('Année de fondation', tontine.anneeFondation?.toString() || '-');
    if (tontine.motto) {
      pdf.addKeyValue('Devise', tontine.motto);
    }
    if (tontine.estOfficiellementDeclaree) {
      pdf.addKeyValue('N° Enregistrement', tontine.numeroEnregistrement || '-');
    }

    pdf.addSpace();

    // Statistiques
    const exerciceActif = tontine.exercices?.find(e => e.statut === StatutExercice.OUVERT);
    const membresActifs = tontine.adhesions?.filter(a => a.statut === StatutAdhesion.ACTIVE).length || 0;

    pdf.addSummaryBoxes([
      {
        title: 'Membres',
        items: [
          { label: 'Total', value: tontine.adhesions?.length?.toString() || '0' },
          { label: 'Actifs', value: membresActifs.toString(), highlight: true },
        ],
      },
      {
        title: 'Exercices',
        items: [
          { label: 'Total', value: tontine.exercices?.length?.toString() || '0' },
          { label: 'Actif', value: exerciceActif?.libelle || 'Aucun' },
        ],
      },
      {
        title: 'Création',
        items: [
          { label: 'Date', value: formatDate(tontine.creeLe) },
          { label: 'Dernière modif.', value: formatDate(tontine.modifieLe) },
        ],
      },
    ]);

    // Liste des membres
    if (tontine.adhesions && tontine.adhesions.length > 0) {
      pdf.addSectionTitle('Liste des Membres');

      const columns: TableColumn[] = [
        { header: 'Matricule', field: 'matricule', width: 80 },
        { header: 'Nom', field: 'nom', width: 150 },
        { header: 'Téléphone', field: 'telephone', width: 100 },
        { header: 'Rôle', field: 'role', width: 100 },
        { header: 'Statut', field: 'statut', width: 80 },
        { header: 'Date adhésion', field: 'dateAdhesion', width: 100 },
      ];

      const data = tontine.adhesions.map(a => ({
        matricule: a.matricule || '-',
        nom: a.utilisateur?.nom || '-',
        telephone: a.utilisateur?.telephone1 || '-',
        role: a.role || 'MEMBRE',
        statut: a.statut,
        dateAdhesion: formatDate(a.dateAdhesionTontine),
      }));

      pdf.addTable(columns, data);
    }

    return pdf.generateBuffer();
  }

  /**
   * Exporter le bilan d'un exercice
   */
  async exportExerciceBilan(exerciceId: string): Promise<Buffer> {
    const exercice = await this.exerciceRepository.findOne({
      where: { id: exerciceId },
      relations: ['tontine', 'reunions', 'membres', 'membres.adhesionTontine', 'membres.adhesionTontine.utilisateur'],
    });

    if (!exercice) {
      throw new NotFoundError(`Exercice non trouvé: ${exerciceId}`);
    }

    const pdf = createPDFService({
      title: `Bilan Exercice: ${exercice.libelle}`,
      subtitle: exercice.tontine?.nom,
      author: 'Nkapay',
    });

    pdf.addHeader();

    // Informations exercice
    const dateDebut = `${exercice.moisDebut}/${exercice.anneeDebut}`;
    const dateFin = `${exercice.moisFin}/${exercice.anneeFin}`;

    pdf.addSectionTitle('Informations de l\'Exercice');
    pdf.addKeyValue('Libellé', exercice.libelle);
    pdf.addKeyValue('Tontine', exercice.tontine?.nom || '-');
    pdf.addKeyValue('Période', `${dateDebut} - ${dateFin}`);
    pdf.addKeyValue('Durée', `${exercice.dureeMois} mois`);
    pdf.addKeyValue('Statut', exercice.statut);

    pdf.addSpace();

    // Statistiques des réunions
    const reunionsCloturees = exercice.reunions?.filter(r => r.statut === StatutReunion.CLOTUREE).length || 0;
    const reunionsTotal = exercice.reunions?.length || 0;
    const membresInscrits = exercice.membres?.length || 0;

    // Récupérer les transactions des réunions de cet exercice
    const reunionIds = exercice.reunions?.map(r => r.id) || [];
    let totalCotisations = 0;
    let totalDistributions = 0;

    if (reunionIds.length > 0) {
      const transactions = await this.transactionRepository
        .createQueryBuilder('t')
        .where('t.reunionId IN (:...reunionIds)', { reunionIds })
        .andWhere('t.statut = :statut', { statut: StatutTransaction.VALIDE })
        .getMany();

      totalCotisations = transactions
        .filter(t => t.typeTransaction === TypeTransaction.COTISATION)
        .reduce((sum, t) => sum + Number(t.montant), 0);

      totalDistributions = transactions
        .filter(t => t.typeTransaction === TypeTransaction.POT)
        .reduce((sum, t) => sum + Number(t.montant), 0);
    }

    pdf.addSummaryBoxes([
      {
        title: 'Réunions',
        items: [
          { label: 'Prévues', value: reunionsTotal.toString() },
          { label: 'Clôturées', value: reunionsCloturees.toString(), highlight: true },
          { label: 'Progression', value: reunionsTotal > 0 ? `${Math.round((reunionsCloturees / reunionsTotal) * 100)}%` : '0%' },
        ],
      },
      {
        title: 'Membres',
        items: [
          { label: 'Inscrits', value: membresInscrits.toString() },
        ],
      },
      {
        title: 'Finances',
        items: [
          { label: 'Cotisations', value: `${totalCotisations.toLocaleString('fr-FR')} FCFA`, highlight: true },
          { label: 'Pots distribués', value: `${totalDistributions.toLocaleString('fr-FR')} FCFA` },
        ],
      },
    ]);

    // Liste des réunions
    if (exercice.reunions && exercice.reunions.length > 0) {
      pdf.addSectionTitle('Planning des Réunions');

      const columns: TableColumn[] = [
        { header: 'N°', field: 'numero', width: 40, align: 'center' },
        { header: 'Date', field: 'date', width: 100 },
        { header: 'Lieu', field: 'lieu', width: 150 },
        { header: 'Statut', field: 'statut', width: 100 },
      ];

      const data = exercice.reunions
        .sort((a, b) => a.numeroReunion - b.numeroReunion)
        .map(r => ({
          numero: r.numeroReunion,
          date: formatDate(r.dateReunion),
          lieu: r.lieu || '-',
          statut: r.statut,
        }));

      pdf.addTable(columns, data);
    }

    // Liste des membres de l'exercice
    if (exercice.membres && exercice.membres.length > 0) {
      pdf.addSectionTitle('Membres Participants');

      const columns: TableColumn[] = [
        { header: 'Ordre', field: 'ordre', width: 60, align: 'center' },
        { header: 'Matricule', field: 'matricule', width: 80 },
        { header: 'Nom', field: 'nom', width: 180 },
        { header: 'Rôle', field: 'role', width: 100 },
      ];

      const data = exercice.membres
        .sort((a, b) => (a.moisEntree || 0) - (b.moisEntree || 0))
        .map((em, index) => ({
          ordre: index + 1,
          matricule: em.adhesionTontine?.matricule || '-',
          nom: em.adhesionTontine?.utilisateur?.nom || '-',
          role: em.typeMembre || 'ANCIEN',
        }));

      pdf.addTable(columns, data);
    }

    return pdf.generateBuffer();
  }

  /**
   * Exporter le rapport d'une réunion
   */
  async exportReunionRapport(reunionId: string): Promise<Buffer> {
    const reunion = await this.reunionRepository.findOne({
      where: { id: reunionId },
      relations: ['exercice', 'exercice.tontine', 'presences', 'presences.exerciceMembre', 'presences.exerciceMembre.adhesionTontine', 'presences.exerciceMembre.adhesionTontine.utilisateur'],
    });

    if (!reunion) {
      throw new NotFoundError(`Réunion non trouvée: ${reunionId}`);
    }

    const pdf = createPDFService({
      title: `Rapport Réunion N°${reunion.numeroReunion}`,
      subtitle: `${reunion.exercice?.tontine?.nom} - ${reunion.exercice?.libelle}`,
      author: 'Nkapay',
    });

    pdf.addHeader();

    // Informations réunion
    pdf.addSectionTitle('Informations de la Réunion');
    pdf.addKeyValue('Date', formatDate(reunion.dateReunion));
    pdf.addKeyValue('Lieu', reunion.lieu || '-');
    pdf.addKeyValue('Statut', reunion.statut);
    pdf.addKeyValue('Tontine', reunion.exercice?.tontine?.nom || '-');
    pdf.addKeyValue('Exercice', reunion.exercice?.libelle || '-');

    pdf.addSpace();

    // Statistiques de présence
    const totalMembres = reunion.presences?.length || 0;
    const presents = reunion.presences?.filter(p => p.estPresent).length || 0;
    const absents = totalMembres - presents;
    const tauxPresence = totalMembres > 0 ? Math.round((presents / totalMembres) * 100) : 0;

    pdf.addSummaryBoxes([
      {
        title: 'Présences',
        items: [
          { label: 'Total membres', value: totalMembres.toString() },
          { label: 'Présents', value: presents.toString(), highlight: true },
          { label: 'Absents', value: absents.toString() },
          { label: 'Taux', value: `${tauxPresence}%` },
        ],
      },
    ]);

    // Liste des présences
    if (reunion.presences && reunion.presences.length > 0) {
      pdf.addSectionTitle('Liste des Présences');

      const columns: TableColumn[] = [
        { header: 'Nom', field: 'nom', width: 200 },
        { header: 'Présence', field: 'presence', width: 80, align: 'center' },
        { header: 'Heure arrivée', field: 'heureArrivee', width: 100, align: 'center' },
        { header: 'Note', field: 'note', width: 180 },
      ];

      const data = reunion.presences.map(p => ({
        nom: p.exerciceMembre?.adhesionTontine?.utilisateur?.nom || '-',
        presence: p.estPresent ? '✓ Présent' : '✗ Absent',
        heureArrivee: p.heureArrivee || '-',
        note: p.note || '-',
      }));

      pdf.addTable(columns, data);
    }

    return pdf.generateBuffer();
  }

  /**
   * Exporter la liste des membres d'une tontine
   */
  async exportMembresListe(tontineId: string): Promise<Buffer> {
    const tontine = await this.tontineRepository.findOne({
      where: { id: tontineId },
      relations: ['adhesions', 'adhesions.utilisateur'],
    });

    if (!tontine) {
      throw new NotFoundError(`Tontine non trouvée: ${tontineId}`);
    }

    const pdf = createPDFService({
      title: `Liste des Membres`,
      subtitle: tontine.nom,
      author: 'Nkapay',
      orientation: 'landscape',
    });

    pdf.addHeader();

    // Statistiques
    const totalMembres = tontine.adhesions?.length || 0;
    const membresActifs = tontine.adhesions?.filter(a => a.statut === StatutAdhesion.ACTIVE).length || 0;
    const membresInactifs = tontine.adhesions?.filter(a => a.statut === StatutAdhesion.INACTIVE).length || 0;

    pdf.addSummaryBoxes([
      {
        title: 'Effectifs',
        items: [
          { label: 'Total', value: totalMembres.toString() },
          { label: 'Actifs', value: membresActifs.toString(), highlight: true },
          { label: 'Inactifs', value: membresInactifs.toString() },
        ],
      },
    ]);

    // Tableau des membres
    pdf.addSectionTitle('Membres');

    const columns: TableColumn[] = [
      { header: 'N°', field: 'numero', width: 40, align: 'center' },
      { header: 'Matricule', field: 'matricule', width: 80 },
      { header: 'Nom complet', field: 'nom', width: 180 },
      { header: 'Téléphone', field: 'telephone', width: 100 },
      { header: 'Adresse', field: 'adresse', width: 150 },
      { header: 'Rôle', field: 'role', width: 100 },
      { header: 'Statut', field: 'statut', width: 80 },
      { header: 'Date adhésion', field: 'dateAdhesion', width: 100 },
    ];

    const data = (tontine.adhesions || [])
      .sort((a, b) => (a.utilisateur?.nom || '').localeCompare(b.utilisateur?.nom || ''))
      .map((a, index) => ({
        numero: index + 1,
        matricule: a.matricule || '-',
        nom: a.utilisateur?.nom || '-',
        telephone: a.utilisateur?.telephone1 || '-',
        adresse: a.utilisateur?.adresseResidence || '-',
        role: a.role || 'MEMBRE',
        statut: a.statut,
        dateAdhesion: formatDate(a.dateAdhesionTontine),
      }));

    pdf.addTable(columns, data);

    return pdf.generateBuffer();
  }
}

export const tontineExportService = new TontineExportService();
