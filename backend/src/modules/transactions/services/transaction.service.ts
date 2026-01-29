/**
 * Service pour la gestion des transactions
 */

import { AppDataSource } from '../../../config';
import { NotFoundError, BadRequestError } from '../../../shared';
import { Transaction, TypeTransaction, StatutTransaction, ModeCreationTransaction } from '../entities/transaction.entity';
import { ExerciceMembre } from '../../exercices/entities/exercice-membre.entity';
import { Reunion } from '../../reunions/entities/reunion.entity';
import {
  CreateTransactionDto,
  UpdateTransactionDto,
  ValiderTransactionDto,
  RejeterTransactionDto,
  TransactionResponseDto,
  TransactionFiltersDto,
  TransactionsSummaryDto,
  CreateCotisationDto,
  CreatePotDto,
  CreateInscriptionDto,
} from '../dto/transaction.dto';
import { v4 as uuidv4 } from 'uuid';

const transactionRepository = AppDataSource.getRepository(Transaction);
const exerciceMembreRepository = AppDataSource.getRepository(ExerciceMembre);
const reunionRepository = AppDataSource.getRepository(Reunion);

export class TransactionService {
  /**
   * Generer une reference unique pour la transaction
   */
  private generateReference(type: TypeTransaction): string {
    const prefix = type.substring(0, 3).toUpperCase();
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = uuidv4().substring(0, 6).toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
  }

  /**
   * Creer une transaction
   */
  async create(dto: CreateTransactionDto): Promise<TransactionResponseDto> {
    // Verifier le membre si fourni
    if (dto.exerciceMembreId) {
      const membre = await exerciceMembreRepository.findOne({ where: { id: dto.exerciceMembreId } });
      if (!membre) {
        throw new NotFoundError(`Membre d'exercice non trouve: ${dto.exerciceMembreId}`);
      }
    }

    // Verifier la reunion si fournie
    if (dto.reunionId) {
      const reunion = await reunionRepository.findOne({ where: { id: dto.reunionId } });
      if (!reunion) {
        throw new NotFoundError(`Reunion non trouvee: ${dto.reunionId}`);
      }
    }

    const transaction = transactionRepository.create({
      reunionId: dto.reunionId || null,
      typeTransaction: dto.typeTransaction,
      exerciceMembreId: dto.exerciceMembreId || null,
      projetId: dto.projetId || null,
      montant: dto.montant,
      reference: this.generateReference(dto.typeTransaction),
      description: dto.description || null,
      statut: dto.autoSoumis ? StatutTransaction.SOUMIS : StatutTransaction.BROUILLON,
      modeCreation: dto.modeCreation || ModeCreationTransaction.MANUEL,
      creeParUtilisateurId: dto.creeParUtilisateurId || null,
      creeParExerciceMembreId: dto.creeParExerciceMembreId || null,
      autoSoumis: dto.autoSoumis || false,
      soumisLe: dto.autoSoumis ? new Date() : null,
    });

    const saved = await transactionRepository.save(transaction);
    return this.findById(saved.id);
  }

  /**
   * Creer une cotisation
   */
  async createCotisation(dto: CreateCotisationDto): Promise<TransactionResponseDto> {
    return this.create({
      reunionId: dto.reunionId,
      typeTransaction: TypeTransaction.COTISATION,
      exerciceMembreId: dto.exerciceMembreId,
      montant: dto.montant,
      description: dto.description || 'Cotisation mensuelle',
      modeCreation: dto.modeCreation,
      creeParExerciceMembreId: dto.creeParExerciceMembreId,
      autoSoumis: dto.autoSoumis,
    });
  }

  /**
   * Creer une contribution au pot
   */
  async createPot(dto: CreatePotDto): Promise<TransactionResponseDto> {
    return this.create({
      reunionId: dto.reunionId,
      typeTransaction: TypeTransaction.POT,
      exerciceMembreId: dto.exerciceMembreId,
      montant: dto.montant,
      description: dto.description || 'Contribution au pot',
      modeCreation: dto.modeCreation,
      creeParExerciceMembreId: dto.creeParExerciceMembreId,
      autoSoumis: dto.autoSoumis,
    });
  }

  /**
   * Creer des frais d'inscription
   */
  async createInscription(dto: CreateInscriptionDto): Promise<TransactionResponseDto> {
    return this.create({
      typeTransaction: TypeTransaction.INSCRIPTION,
      exerciceMembreId: dto.exerciceMembreId,
      montant: dto.montant,
      description: 'Frais d\'inscription',
      modeCreation: dto.modeCreation,
      creeParExerciceMembreId: dto.creeParExerciceMembreId,
      autoSoumis: dto.autoSoumis,
    });
  }

  /**
   * Soumettre une transaction
   */
  async soumettre(id: string): Promise<TransactionResponseDto> {
    const transaction = await transactionRepository.findOne({ where: { id } });
    if (!transaction) {
      throw new NotFoundError(`Transaction non trouvee: ${id}`);
    }

    if (transaction.statut !== StatutTransaction.BROUILLON) {
      throw new BadRequestError('Seule une transaction en brouillon peut etre soumise');
    }

    transaction.statut = StatutTransaction.SOUMIS;
    transaction.soumisLe = new Date();

    await transactionRepository.save(transaction);
    return this.findById(id);
  }

  /**
   * Valider une transaction
   */
  async valider(id: string, dto: ValiderTransactionDto): Promise<TransactionResponseDto> {
    const transaction = await transactionRepository.findOne({ where: { id } });
    if (!transaction) {
      throw new NotFoundError(`Transaction non trouvee: ${id}`);
    }

    if (transaction.statut !== StatutTransaction.SOUMIS) {
      throw new BadRequestError('Seule une transaction soumise peut etre validee');
    }

    transaction.statut = StatutTransaction.VALIDE;
    transaction.valideLe = new Date();
    transaction.valideParExerciceMembreId = dto.valideParExerciceMembreId;

    await transactionRepository.save(transaction);
    return this.findById(id);
  }

  /**
   * Rejeter une transaction
   */
  async rejeter(id: string, dto: RejeterTransactionDto): Promise<TransactionResponseDto> {
    const transaction = await transactionRepository.findOne({ where: { id } });
    if (!transaction) {
      throw new NotFoundError(`Transaction non trouvee: ${id}`);
    }

    if (transaction.statut !== StatutTransaction.SOUMIS) {
      throw new BadRequestError('Seule une transaction soumise peut etre rejetee');
    }

    transaction.statut = StatutTransaction.REJETE;
    transaction.rejeteLe = new Date();
    transaction.rejeteParExerciceMembreId = dto.rejeteParExerciceMembreId;
    transaction.motifRejet = dto.motifRejet;

    await transactionRepository.save(transaction);
    return this.findById(id);
  }

  /**
   * Annuler une transaction
   */
  async annuler(id: string): Promise<TransactionResponseDto> {
    const transaction = await transactionRepository.findOne({ where: { id } });
    if (!transaction) {
      throw new NotFoundError(`Transaction non trouvee: ${id}`);
    }

    if (transaction.statut === StatutTransaction.VALIDE) {
      throw new BadRequestError('Une transaction validee ne peut pas etre annulee');
    }

    transaction.statut = StatutTransaction.ANNULE;

    await transactionRepository.save(transaction);
    return this.findById(id);
  }

  /**
   * Lister les transactions
   */
  async findAll(filters?: TransactionFiltersDto): Promise<{ transactions: TransactionResponseDto[]; total: number }> {
    const queryBuilder = transactionRepository
      .createQueryBuilder('t')
      .leftJoinAndSelect('t.exerciceMembre', 'em')
      .leftJoinAndSelect('em.adhesionTontine', 'adhesion')
      .leftJoinAndSelect('adhesion.utilisateur', 'utilisateur')
      .leftJoinAndSelect('t.projet', 'projet');

    if (filters?.reunionId) {
      queryBuilder.andWhere('t.reunionId = :reunionId', { reunionId: filters.reunionId });
    }
    if (filters?.exerciceId) {
      queryBuilder.andWhere('em.exerciceId = :exerciceId', { exerciceId: filters.exerciceId });
    }
    if (filters?.exerciceMembreId) {
      queryBuilder.andWhere('t.exerciceMembreId = :exerciceMembreId', { exerciceMembreId: filters.exerciceMembreId });
    }
    if (filters?.typeTransaction) {
      queryBuilder.andWhere('t.typeTransaction = :typeTransaction', { typeTransaction: filters.typeTransaction });
    }
    if (filters?.statut) {
      queryBuilder.andWhere('t.statut = :statut', { statut: filters.statut });
    }
    if (filters?.dateDebut) {
      queryBuilder.andWhere('t.creeLe >= :dateDebut', { dateDebut: filters.dateDebut });
    }
    if (filters?.dateFin) {
      queryBuilder.andWhere('t.creeLe <= :dateFin', { dateFin: filters.dateFin });
    }

    const total = await queryBuilder.getCount();

    if (filters?.page && filters?.limit) {
      queryBuilder.skip((filters.page - 1) * filters.limit).take(filters.limit);
    }

    const transactions = await queryBuilder
      .orderBy('t.creeLe', 'DESC')
      .getMany();

    return {
      transactions: transactions.map((t) => this.toResponseDto(t)),
      total,
    };
  }

  /**
   * Trouver une transaction par ID
   */
  async findById(id: string): Promise<TransactionResponseDto> {
    const transaction = await transactionRepository.findOne({
      where: { id },
      relations: ['exerciceMembre', 'exerciceMembre.adhesionTontine', 'exerciceMembre.adhesionTontine.utilisateur', 'projet'],
    });

    if (!transaction) {
      throw new NotFoundError(`Transaction non trouvee: ${id}`);
    }

    return this.toResponseDto(transaction);
  }

  /**
   * Trouver une transaction par reference
   */
  async findByReference(reference: string): Promise<TransactionResponseDto> {
    const transaction = await transactionRepository.findOne({
      where: { reference },
      relations: ['exerciceMembre', 'exerciceMembre.adhesionTontine', 'exerciceMembre.adhesionTontine.utilisateur', 'projet'],
    });

    if (!transaction) {
      throw new NotFoundError(`Transaction non trouvee: ${reference}`);
    }

    return this.toResponseDto(transaction);
  }

  /**
   * Mettre a jour une transaction
   */
  async update(id: string, dto: UpdateTransactionDto): Promise<TransactionResponseDto> {
    const transaction = await transactionRepository.findOne({ where: { id } });
    if (!transaction) {
      throw new NotFoundError(`Transaction non trouvee: ${id}`);
    }

    if (transaction.statut !== StatutTransaction.BROUILLON) {
      throw new BadRequestError('Seule une transaction en brouillon peut etre modifiee');
    }

    if (dto.montant !== undefined) transaction.montant = dto.montant;
    if (dto.description !== undefined) transaction.description = dto.description;
    if (dto.projetId !== undefined) transaction.projetId = dto.projetId;

    await transactionRepository.save(transaction);
    return this.findById(id);
  }

  /**
   * Supprimer une transaction
   */
  async delete(id: string): Promise<void> {
    const transaction = await transactionRepository.findOne({ where: { id } });
    if (!transaction) {
      throw new NotFoundError(`Transaction non trouvee: ${id}`);
    }

    if (transaction.statut !== StatutTransaction.BROUILLON) {
      throw new BadRequestError('Seule une transaction en brouillon peut etre supprimee');
    }

    await transactionRepository.remove(transaction);
  }

  /**
   * Obtenir le resume des transactions
   */
  async getSummary(filters?: TransactionFiltersDto): Promise<TransactionsSummaryDto> {
    const { transactions } = await this.findAll(filters);

    const parType: { [key: string]: { count: number; montant: number } } = {};
    const parStatut: { [key: string]: { count: number; montant: number } } = {};

    let totalMontant = 0;

    for (const t of transactions) {
      totalMontant += Number(t.montant);

      if (!parType[t.typeTransaction]) {
        parType[t.typeTransaction] = { count: 0, montant: 0 };
      }
      parType[t.typeTransaction].count++;
      parType[t.typeTransaction].montant += Number(t.montant);

      if (!parStatut[t.statut]) {
        parStatut[t.statut] = { count: 0, montant: 0 };
      }
      parStatut[t.statut].count++;
      parStatut[t.statut].montant += Number(t.montant);
    }

    return {
      totalTransactions: transactions.length,
      totalMontant,
      parType: Object.entries(parType).map(([type, data]) => ({
        type: type as TypeTransaction,
        count: data.count,
        montant: data.montant,
      })),
      parStatut: Object.entries(parStatut).map(([statut, data]) => ({
        statut: statut as StatutTransaction,
        count: data.count,
        montant: data.montant,
      })),
    };
  }

  /**
   * Transformer en DTO de reponse
   */
  private toResponseDto(entity: Transaction): TransactionResponseDto {
    const utilisateur = entity.exerciceMembre?.adhesionTontine?.utilisateur;

    return {
      id: entity.id,
      reunionId: entity.reunionId,
      typeTransaction: entity.typeTransaction,
      exerciceMembreId: entity.exerciceMembreId,
      exerciceMembre: entity.exerciceMembre ? {
        id: entity.exerciceMembre.id,
        utilisateurId: utilisateur?.id || '',
        utilisateurNom: utilisateur ? `${utilisateur.prenom} ${utilisateur.nom}` : undefined,
      } : null,
      projetId: entity.projetId,
      projet: entity.projet ? {
        id: entity.projet.id,
        nom: entity.projet.nom,
      } : null,
      montant: Number(entity.montant),
      reference: entity.reference,
      description: entity.description,
      statut: entity.statut,
      modeCreation: entity.modeCreation,
      creeParUtilisateurId: entity.creeParUtilisateurId,
      creeParExerciceMembreId: entity.creeParExerciceMembreId,
      creeLe: entity.creeLe,
      soumisLe: entity.soumisLe,
      autoSoumis: entity.autoSoumis,
      valideLe: entity.valideLe,
      valideParExerciceMembreId: entity.valideParExerciceMembreId,
      rejeteLe: entity.rejeteLe,
      rejeteParExerciceMembreId: entity.rejeteParExerciceMembreId,
      motifRejet: entity.motifRejet,
    };
  }
}

export const transactionService = new TransactionService();
