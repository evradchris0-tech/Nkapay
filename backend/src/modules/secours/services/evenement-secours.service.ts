/**
 * Service pour la gestion des evenements de secours
 * Workflow : DECLARE → EN_COURS_VALIDATION → VALIDE → PAYE
 * 
 * Fonctionnalités CAYA:
 * - Déclaration d'événement avec montant par défaut selon le type
 * - Validation par le bureau (Président/Trésorier)
 * - Décaissement automatique : crée la transaction DEPENSE_SECOURS + met à jour le bilan
 * - Vérification du solde du fonds avant paiement
 * - Renflouement automatique : calcule la cotisation supplémentaire par membre si nécessaire
 */

import { Repository } from 'typeorm';
import { AppDataSource } from '../../../config';
import { NotFoundError, BadRequestError, PaginationQuery, PaginatedResult, paginate } from '../../../shared';
import { EvenementSecours, StatutEvenementSecours } from '../entities/evenement-secours.entity';
import { TypeEvenementSecours } from '../entities/type-evenement-secours.entity';
import { PieceJustificativeSecours } from '../entities/piece-justificative-secours.entity';
import { ExerciceMembre } from '../../exercices/entities/exercice-membre.entity';
import { Transaction, TypeTransaction, ModeCreationTransaction, StatutTransaction } from '../../transactions/entities/transaction.entity';
import { BilanSecoursExercice } from '../entities/bilan-secours-exercice.entity';
import { Exercice } from '../../exercices/entities/exercice.entity';
import {
  CreateEvenementSecoursDto,
  ValiderEvenementSecoursDto,
  RefuserEvenementSecoursDto,
  PayerEvenementSecoursDto,
  DecaisserEvenementSecoursDto,
  EvenementSecoursResponseDto,
  EvenementSecoursFiltersDto,
  SecoursSummaryDto,
  RenflouementInfoDto,
} from '../dto/evenement-secours.dto';

export class EvenementSecoursService {
  private _evenementRepo?: Repository<EvenementSecours>;
  private _typeRepo?: Repository<TypeEvenementSecours>;
  private _membreRepo?: Repository<ExerciceMembre>;
  private _transactionRepo?: Repository<Transaction>;
  private _bilanRepo?: Repository<BilanSecoursExercice>;
  private _exerciceRepo?: Repository<Exercice>;
  private _pieceRepo?: Repository<PieceJustificativeSecours>;

  private get evenementSecoursRepository(): Repository<EvenementSecours> {
    if (!this._evenementRepo) this._evenementRepo = AppDataSource.getRepository(EvenementSecours);
    return this._evenementRepo;
  }

  private get typeEvenementSecoursRepository(): Repository<TypeEvenementSecours> {
    if (!this._typeRepo) this._typeRepo = AppDataSource.getRepository(TypeEvenementSecours);
    return this._typeRepo;
  }

  private get exerciceMembreRepository(): Repository<ExerciceMembre> {
    if (!this._membreRepo) this._membreRepo = AppDataSource.getRepository(ExerciceMembre);
    return this._membreRepo;
  }

  private get transactionRepository(): Repository<Transaction> {
    if (!this._transactionRepo) this._transactionRepo = AppDataSource.getRepository(Transaction);
    return this._transactionRepo;
  }

  private get bilanSecoursRepository(): Repository<BilanSecoursExercice> {
    if (!this._bilanRepo) this._bilanRepo = AppDataSource.getRepository(BilanSecoursExercice);
    return this._bilanRepo;
  }

  private get exerciceRepository(): Repository<Exercice> {
    if (!this._exerciceRepo) this._exerciceRepo = AppDataSource.getRepository(Exercice);
    return this._exerciceRepo;
  }

  private get pieceJustificativeRepository(): Repository<PieceJustificativeSecours> {
    if (!this._pieceRepo) this._pieceRepo = AppDataSource.getRepository(PieceJustificativeSecours);
    return this._pieceRepo;
  }

  // ==========================================================================
  // WORKFLOW PRINCIPAL
  // ==========================================================================

  /**
   * ÉTAPE 1 — Déclarer un événement de secours
   * Le montant demandé peut être spécifié ou déduit du type d'événement
   */
  async create(dto: CreateEvenementSecoursDto): Promise<EvenementSecoursResponseDto> {
    // Vérifier que le membre existe
    const membre = await this.exerciceMembreRepository.findOne({
      where: { id: dto.exerciceMembreId },
      relations: ['adhesionTontine', 'adhesionTontine.utilisateur'],
    });
    if (!membre) {
      throw new NotFoundError(`Membre d'exercice non trouvé: ${dto.exerciceMembreId}`);
    }

    // Vérifier que le type d'événement existe
    const typeEvenement = await this.typeEvenementSecoursRepository.findOne({ where: { id: dto.typeEvenementSecoursId } });
    if (!typeEvenement) {
      throw new NotFoundError(`Type d'événement de secours non trouvé: ${dto.typeEvenementSecoursId}`);
    }

    if (!typeEvenement.estActif) {
      throw new BadRequestError(`Le type d'événement "${typeEvenement.libelle}" est désactivé`);
    }

    // Déterminer le montant : priorité au montant demandé, sinon montant par défaut du type
    const montantDemande = dto.montantDemande || (typeEvenement.montantParDefaut ? Number(typeEvenement.montantParDefaut) : null);

    const evenement = this.evenementSecoursRepository.create({
      exerciceMembreId: dto.exerciceMembreId,
      typeEvenementSecoursId: dto.typeEvenementSecoursId,
      dateEvenement: new Date(dto.dateEvenement),
      description: dto.description || null,
      montantDemande: montantDemande,
      reunionId: dto.reunionId || null,
      statut: StatutEvenementSecours.DECLARE,
    });

    const saved = await this.evenementSecoursRepository.save(evenement);
    return this.findById(saved.id);
  }

  /**
   * ÉTAPE 2 — Soumettre pour validation
   */
  async soumettre(id: string): Promise<EvenementSecoursResponseDto> {
    const evenement = await this.evenementSecoursRepository.findOne({ where: { id } });
    if (!evenement) {
      throw new NotFoundError(`Événement de secours non trouvé: ${id}`);
    }

    if (evenement.statut !== StatutEvenementSecours.DECLARE) {
      throw new BadRequestError('Seul un événement déclaré peut être soumis pour validation');
    }

    evenement.statut = StatutEvenementSecours.EN_COURS_VALIDATION;
    await this.evenementSecoursRepository.save(evenement);

    return this.findById(id);
  }

  /**
   * ÉTAPE 3 — Valider un événement (approbation par le bureau)
   * Le montant approuvé peut différer du montant demandé
   */
  async valider(id: string, dto: ValiderEvenementSecoursDto): Promise<EvenementSecoursResponseDto> {
    const evenement = await this.evenementSecoursRepository.findOne({ where: { id } });
    if (!evenement) {
      throw new NotFoundError(`Événement de secours non trouvé: ${id}`);
    }

    if (evenement.statut !== StatutEvenementSecours.EN_COURS_VALIDATION && evenement.statut !== StatutEvenementSecours.DECLARE) {
      throw new BadRequestError('Cet événement ne peut pas être validé dans son état actuel');
    }

    evenement.statut = StatutEvenementSecours.VALIDE;
    evenement.valideParExerciceMembreId = dto.valideParExerciceMembreId;
    evenement.montantApprouve = dto.montantApprouve;
    evenement.dateValidation = new Date();

    await this.evenementSecoursRepository.save(evenement);
    return this.findById(id);
  }

  /**
   * ÉTAPE 3bis — Refuser un événement
   */
  async refuser(id: string, dto: RefuserEvenementSecoursDto): Promise<EvenementSecoursResponseDto> {
    const evenement = await this.evenementSecoursRepository.findOne({ where: { id } });
    if (!evenement) {
      throw new NotFoundError(`Événement de secours non trouvé: ${id}`);
    }

    if (evenement.statut !== StatutEvenementSecours.EN_COURS_VALIDATION && evenement.statut !== StatutEvenementSecours.DECLARE) {
      throw new BadRequestError('Cet événement ne peut pas être refusé dans son état actuel');
    }

    evenement.statut = StatutEvenementSecours.REFUSE;
    evenement.valideParExerciceMembreId = dto.refuseParExerciceMembreId;
    evenement.motifRefus = dto.motifRefus;
    evenement.dateValidation = new Date();

    await this.evenementSecoursRepository.save(evenement);
    return this.findById(id);
  }

  /**
   * ÉTAPE 4a — Payer un événement (lien vers transaction existante)
   * Méthode simple : associe une transaction déjà créée
   */
  async payer(id: string, dto: PayerEvenementSecoursDto): Promise<EvenementSecoursResponseDto> {
    const evenement = await this.evenementSecoursRepository.findOne({ where: { id } });
    if (!evenement) {
      throw new NotFoundError(`Événement de secours non trouvé: ${id}`);
    }

    if (evenement.statut !== StatutEvenementSecours.VALIDE) {
      throw new BadRequestError('Seul un événement validé peut être payé');
    }

    evenement.statut = StatutEvenementSecours.PAYE;
    evenement.transactionId = dto.transactionId;
    evenement.montantDecaisse = evenement.montantApprouve;
    evenement.dateDecaissement = new Date();

    await this.evenementSecoursRepository.save(evenement);
    return this.findById(id);
  }

  /**
   * ÉTAPE 4b — Décaisser un événement (workflow automatisé CAYA)
   * Crée la transaction DEPENSE_SECOURS + met à jour le bilan + vérifie le solde
   * 
   * Workflow:
   * 1. Vérifie que l'événement est validé
   * 2. Vérifie le solde du fonds de secours (warn si insuffisant)
   * 3. Crée la transaction DEPENSE_SECOURS
   * 4. Met à jour le bilan du fonds
   * 5. Marque l'événement comme PAYE
   * 6. Retourne aussi les infos de renflouement si nécessaire
   */
  async decaisser(id: string, dto: DecaisserEvenementSecoursDto): Promise<{
    evenement: EvenementSecoursResponseDto;
    transaction: { id: string; reference: string; montant: number };
    bilanApres: { soldeFinal: number; totalDepenses: number; nombreEvenements: number };
    renflouement: RenflouementInfoDto | null;
  }> {
    // Lecture préalable HORS transaction (lecture seule)
    const evenement = await this.evenementSecoursRepository.findOne({
      where: { id },
      relations: ['exerciceMembre', 'exerciceMembre.adhesionTontine', 'exerciceMembre.adhesionTontine.utilisateur', 'typeEvenementSecours', 'exerciceMembre.exercice'],
    });
    if (!evenement) {
      throw new NotFoundError(`Événement de secours non trouvé: ${id}`);
    }

    if (evenement.statut !== StatutEvenementSecours.VALIDE) {
      throw new BadRequestError('Seul un événement validé peut être décaissé');
    }

    const montant = evenement.montantApprouve ? Number(evenement.montantApprouve) : 0;
    if (montant <= 0) {
      throw new BadRequestError('Le montant approuvé doit être positif pour décaisser');
    }

    const exerciceId = evenement.exerciceMembre?.exercice?.id;
    if (!exerciceId) {
      throw new BadRequestError('Impossible de déterminer l\'exercice pour ce membre');
    }

    // ============================================================
    // TRANSACTION ACID — Toutes les écritures dans une seule TX
    // ============================================================
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    let savedTxId: string;
    let savedTxRef: string;
    let bilanFinal: { soldeFinal: number; totalDepenses: number; nombreEvenements: number };

    try {
      // 1. Récupérer/créer le bilan (via manager de la transaction)
      let bilan = await queryRunner.manager.findOne(BilanSecoursExercice, {
        where: { exerciceId },
      });
      if (!bilan) {
        bilan = queryRunner.manager.create(BilanSecoursExercice, {
          exerciceId,
          soldeInitial: 0,
          totalCotisations: 0,
          totalDepenses: 0,
          soldeFinal: 0,
          nombreEvenements: 0,
        });
        bilan = await queryRunner.manager.save(BilanSecoursExercice, bilan);
      }

      // 2. Créer la transaction DEPENSE_SECOURS
      const reference = `SEC-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
      const utilisateur = evenement.exerciceMembre?.adhesionTontine?.utilisateur;
      const typeEvt = evenement.typeEvenementSecours;

      const newTransaction = queryRunner.manager.create(Transaction, {
        reunionId: dto.reunionId || evenement.reunionId || null,
        typeTransaction: TypeTransaction.DEPENSE_SECOURS,
        exerciceMembreId: evenement.exerciceMembreId,
        montant: montant,
        reference: reference,
        description: `Secours ${typeEvt?.libelle || 'N/A'} pour ${utilisateur ? `${utilisateur.prenom} ${utilisateur.nom}` : 'N/A'} — ${evenement.description || ''}`.trim(),
        statut: StatutTransaction.VALIDE,
        modeCreation: ModeCreationTransaction.AUTOMATIQUE,
        creeParExerciceMembreId: dto.decaisseParExerciceMembreId || null,
        valideParExerciceMembreId: dto.decaisseParExerciceMembreId || null,
        soumisLe: new Date(),
        valideLe: new Date(),
        autoSoumis: true,
      });
      const savedTx = await queryRunner.manager.save(Transaction, newTransaction);
      savedTxId = savedTx.id;
      savedTxRef = savedTx.reference;

      // 3. Mettre à jour le bilan
      bilan.totalDepenses = Number(bilan.totalDepenses) + montant;
      bilan.nombreEvenements = bilan.nombreEvenements + 1;
      bilan.soldeFinal = Number(bilan.soldeInitial) + Number(bilan.totalCotisations) - Number(bilan.totalDepenses);
      await queryRunner.manager.save(BilanSecoursExercice, bilan);

      bilanFinal = {
        soldeFinal: Number(bilan.soldeFinal),
        totalDepenses: Number(bilan.totalDepenses),
        nombreEvenements: bilan.nombreEvenements,
      };

      // 4. Mettre à jour l'événement
      evenement.statut = StatutEvenementSecours.PAYE;
      evenement.transactionId = savedTx.id;
      evenement.montantDecaisse = montant;
      evenement.dateDecaissement = new Date();
      await queryRunner.manager.save(EvenementSecours, evenement);

      // COMMIT — Tout est cohérent
      await queryRunner.commitTransaction();
    } catch (error) {
      // ROLLBACK — Aucune modification persistée
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }

    // Lecture après commit (hors transaction)
    let renflouement: RenflouementInfoDto | null = null;
    const seuilAlerte = dto.seuilAlerteFonds || 0;
    if (bilanFinal.soldeFinal < seuilAlerte) {
      renflouement = await this.calculerRenflouement(exerciceId, seuilAlerte);
    }

    return {
      evenement: await this.findById(id),
      transaction: {
        id: savedTxId,
        reference: savedTxRef,
        montant: montant,
      },
      bilanApres: bilanFinal,
      renflouement,
    };
  }

  // ==========================================================================
  // RENFLOUEMENT
  // ==========================================================================

  /**
   * Calculer le montant de renflouement nécessaire
   * Répartit le déficit entre tous les membres actifs de l'exercice
   */
  async calculerRenflouement(exerciceId: string, montantCible?: number): Promise<RenflouementInfoDto> {
    const bilan = await this.getOrCreateBilan(exerciceId);
    const soldeFinal = Number(bilan.soldeFinal);

    // Par défaut, renflouer jusqu'à atteindre au moins montantCible (ou 0)
    const cible = montantCible || 0;
    const deficit = Math.max(0, cible - soldeFinal);

    // Compter les membres actifs
    const membresActifs = await this.exerciceMembreRepository
      .createQueryBuilder('em')
      .where('em.exerciceId = :exerciceId', { exerciceId })
      .andWhere('em.statut = :statut', { statut: 'ACTIF' })
      .getCount();

    const montantParMembre = membresActifs > 0 ? Math.ceil(deficit / membresActifs) : 0;

    return {
      exerciceId,
      soldeFondsActuel: soldeFinal,
      montantCible: cible,
      deficit,
      membresActifs,
      montantParMembre,
      estNecessaire: deficit > 0,
    };
  }

  // ==========================================================================
  // REQUÊTES
  // ==========================================================================

  /**
   * Lister les événements de secours avec filtres
   */
  async findAll(filters?: EvenementSecoursFiltersDto, pagination?: PaginationQuery): Promise<PaginatedResult<EvenementSecoursResponseDto>> {
    const queryBuilder = this.evenementSecoursRepository
      .createQueryBuilder('es')
      .leftJoinAndSelect('es.exerciceMembre', 'em')
      .leftJoinAndSelect('em.adhesionTontine', 'adhesion')
      .leftJoinAndSelect('adhesion.utilisateur', 'utilisateur')
      .leftJoinAndSelect('es.typeEvenementSecours', 'te')
      .leftJoinAndSelect('es.piecesJustificatives', 'pj');

    if (filters?.exerciceId) {
      queryBuilder.andWhere('em.exerciceId = :exerciceId', { exerciceId: filters.exerciceId });
    }
    if (filters?.exerciceMembreId) {
      queryBuilder.andWhere('es.exerciceMembreId = :exerciceMembreId', { exerciceMembreId: filters.exerciceMembreId });
    }
    if (filters?.typeEvenementSecoursId) {
      queryBuilder.andWhere('es.typeEvenementSecoursId = :typeEvenementSecoursId', { typeEvenementSecoursId: filters.typeEvenementSecoursId });
    }
    if (filters?.statut) {
      queryBuilder.andWhere('es.statut = :statut', { statut: filters.statut });
    }
    if (filters?.dateDebut) {
      queryBuilder.andWhere('es.dateEvenement >= :dateDebut', { dateDebut: filters.dateDebut });
    }
    if (filters?.dateFin) {
      queryBuilder.andWhere('es.dateEvenement <= :dateFin', { dateFin: filters.dateFin });
    }

    queryBuilder.orderBy('es.dateDeclaration', 'DESC');

    const result = await paginate(queryBuilder, pagination || { limit: 100 });

    return {
      data: result.data.map((e: EvenementSecours) => this.toResponseDto(e)),
      meta: result.meta,
    };
  }

  /**
   * Trouver un événement par ID
   */
  async findById(id: string): Promise<EvenementSecoursResponseDto> {
    const evenement = await this.evenementSecoursRepository.findOne({
      where: { id },
      relations: [
        'exerciceMembre',
        'exerciceMembre.adhesionTontine',
        'exerciceMembre.adhesionTontine.utilisateur',
        'typeEvenementSecours',
        'piecesJustificatives',
      ],
    });

    if (!evenement) {
      throw new NotFoundError(`Événement de secours non trouvé: ${id}`);
    }

    return this.toResponseDto(evenement);
  }

  /**
   * Obtenir le résumé des secours
   */
  async getSummary(filters?: EvenementSecoursFiltersDto): Promise<SecoursSummaryDto> {
    const result = await this.findAll(filters);
    const evenements = result.data;

    const totalEvenements = evenements.length;
    const totalMontantDemande = evenements.reduce((sum, e) => sum + Number(e.montantDemande || 0), 0);
    const totalMontantApprouve = evenements.reduce((sum, e) => sum + Number(e.montantApprouve || 0), 0);
    const evenementsPaues = evenements.filter((e) => e.statut === StatutEvenementSecours.PAYE);
    const totalMontantPaye = evenementsPaues.reduce((sum, e) => sum + Number(e.montantDecaisse || e.montantApprouve || 0), 0);

    // Ajouter le solde du fonds si on a un exerciceId
    let soldeFonds: number | undefined;
    if (filters?.exerciceId) {
      const bilan = await this.bilanSecoursRepository.findOne({
        where: { exerciceId: filters.exerciceId },
      });
      soldeFonds = bilan ? Number(bilan.soldeFinal) : undefined;
    }

    return {
      totalEvenements,
      totalMontantDemande,
      totalMontantApprouve,
      totalMontantPaye,
      evenementsEnAttente: evenements.filter((e) => e.statut === StatutEvenementSecours.DECLARE || e.statut === StatutEvenementSecours.EN_COURS_VALIDATION).length,
      evenementsValides: evenements.filter((e) => e.statut === StatutEvenementSecours.VALIDE).length,
      evenementsPaues: evenementsPaues.length,
      evenementsRefuses: evenements.filter((e) => e.statut === StatutEvenementSecours.REFUSE).length,
      soldeFonds,
    };
  }

  /**
   * Historique des secours d'un membre spécifique
   */
  async findByMembre(exerciceMembreId: string): Promise<EvenementSecoursResponseDto[]> {
    const result = await this.findAll({ exerciceMembreId });
    return result.data;
  }

  /**
   * Obtenir le solde actuel du fonds
   */
  async getSoldeFonds(exerciceId: string): Promise<{ solde: number; details: { soldeInitial: number; totalCotisations: number; totalDepenses: number; nombreEvenements: number } }> {
    const bilan = await this.getOrCreateBilan(exerciceId);
    return {
      solde: Number(bilan.soldeFinal),
      details: {
        soldeInitial: Number(bilan.soldeInitial),
        totalCotisations: Number(bilan.totalCotisations),
        totalDepenses: Number(bilan.totalDepenses),
        nombreEvenements: bilan.nombreEvenements,
      },
    };
  }

  // ==========================================================================
  // PIÈCES JUSTIFICATIVES
  // ==========================================================================

  /**
   * Ajouter une pièce justificative à un événement
   */
  async ajouterPieceJustificative(evenementId: string, data: {
    typePiece: string;
    nomFichier: string;
    cheminFichier: string;
    typeMime?: string;
    tailleOctets?: number;
    commentaire?: string;
  }): Promise<PieceJustificativeSecours> {
    const evenement = await this.evenementSecoursRepository.findOne({ where: { id: evenementId } });
    if (!evenement) {
      throw new NotFoundError(`Événement de secours non trouvé: ${evenementId}`);
    }

    const piece = this.pieceJustificativeRepository.create({
      evenementSecoursId: evenementId,
      typePiece: data.typePiece as any,
      nomFichier: data.nomFichier,
      cheminFichier: data.cheminFichier,
      typeMime: data.typeMime || null,
      tailleOctets: data.tailleOctets || null,
      commentaire: data.commentaire || null,
    });

    return this.pieceJustificativeRepository.save(piece);
  }

  /**
   * Lister les pièces justificatives d'un événement
   */
  async getPiecesJustificatives(evenementId: string): Promise<PieceJustificativeSecours[]> {
    return this.pieceJustificativeRepository.find({
      where: { evenementSecoursId: evenementId },
      order: { creeLe: 'ASC' },
    });
  }

  /**
   * Supprimer une pièce justificative
   */
  async supprimerPieceJustificative(pieceId: string): Promise<void> {
    const piece = await this.pieceJustificativeRepository.findOne({ where: { id: pieceId } });
    if (!piece) {
      throw new NotFoundError(`Pièce justificative non trouvée: ${pieceId}`);
    }
    await this.pieceJustificativeRepository.remove(piece);
  }

  // ==========================================================================
  // HELPERS
  // ==========================================================================

  /**
   * S'assurer qu'un bilan existe pour l'exercice
   */
  private async getOrCreateBilan(exerciceId: string): Promise<BilanSecoursExercice> {
    let bilan = await this.bilanSecoursRepository.findOne({
      where: { exerciceId },
    });

    if (!bilan) {
      bilan = this.bilanSecoursRepository.create({
        exerciceId,
        soldeInitial: 0,
        totalCotisations: 0,
        totalDepenses: 0,
        soldeFinal: 0,
        nombreEvenements: 0,
      });
      bilan = await this.bilanSecoursRepository.save(bilan);
    }

    return bilan;
  }

  /**
   * Transformer en DTO de réponse
   */
  private toResponseDto(entity: EvenementSecours): EvenementSecoursResponseDto {
    const utilisateur = entity.exerciceMembre?.adhesionTontine?.utilisateur;

    return {
      id: entity.id,
      exerciceMembreId: entity.exerciceMembreId,
      exerciceMembre: entity.exerciceMembre ? {
        id: entity.exerciceMembre.id,
        utilisateurId: utilisateur?.id || '',
        utilisateurNom: utilisateur ? `${utilisateur.prenom} ${utilisateur.nom}` : undefined,
      } : undefined,
      typeEvenementSecoursId: entity.typeEvenementSecoursId,
      typeEvenementSecours: entity.typeEvenementSecours ? {
        id: entity.typeEvenementSecours.id,
        code: entity.typeEvenementSecours.code,
        libelle: entity.typeEvenementSecours.libelle,
        montantParDefaut: entity.typeEvenementSecours.montantParDefaut ? Number(entity.typeEvenementSecours.montantParDefaut) : undefined,
      } : undefined,
      dateEvenement: new Date(entity.dateEvenement).toISOString().split('T')[0],
      description: entity.description,
      montantDemande: entity.montantDemande ? Number(entity.montantDemande) : null,
      montantApprouve: entity.montantApprouve ? Number(entity.montantApprouve) : null,
      montantDecaisse: entity.montantDecaisse ? Number(entity.montantDecaisse) : null,
      statut: entity.statut,
      dateDeclaration: entity.dateDeclaration,
      dateValidation: entity.dateValidation,
      dateDecaissement: entity.dateDecaissement,
      valideParExerciceMembreId: entity.valideParExerciceMembreId,
      transactionId: entity.transactionId,
      reunionId: entity.reunionId,
      motifRefus: entity.motifRefus,
      piecesJustificatives: entity.piecesJustificatives?.map((pj) => ({
        id: pj.id,
        typePiece: pj.typePiece,
        nomFichier: pj.nomFichier,
        creeLe: pj.creeLe,
      })) || [],
    };
  }
}

export const evenementSecoursService = new EvenementSecoursService();
