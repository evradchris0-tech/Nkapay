/**
 * Service pour la gestion des transactions
 */

import { Repository } from 'typeorm';
import { eventBus, AppEvents } from '../../../shared/utils/event-bus.util';
import { AppDataSource } from '../../../config';
import {
  NotFoundError,
  BadRequestError,
  PaginationQuery,
  PaginatedResult,
  paginate,
} from '../../../shared';
import {
  Transaction,
  TypeTransaction,
  StatutTransaction,
  ModeCreationTransaction,
} from '../entities/transaction.entity';
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
import { cotisationDueService } from './cotisation-due.service';
import { potDuService } from './pot-du.service';
import { inscriptionDueService } from './inscription-due.service';
import { epargneDueService } from './epargne-due.service';
import { regleExerciceService } from '../../exercices/services/regle-exercice.service';
import { StateMachine } from '../../../shared/utils/state-machine.util';

// =============================================================================
// Machine à États (Design Pattern: State)
// =============================================================================

const transactionStateMachine = new StateMachine<StatutTransaction>(
  [
    { from: StatutTransaction.BROUILLON, to: StatutTransaction.SOUMIS, action: 'soumettre' },
    { from: StatutTransaction.SOUMIS, to: StatutTransaction.VALIDE, action: 'valider' },
    { from: StatutTransaction.SOUMIS, to: StatutTransaction.REJETE, action: 'rejeter' },
    { from: StatutTransaction.VALIDE, to: StatutTransaction.ANNULE, action: 'annuler' },
  ],
  'Transaction'
);

import { RepositoryFactory } from '../../../shared/utils/repository.factory';
import { TransactionBuilder } from '../builders/transaction.builder';

export class TransactionService {
  // Repositories (Design Pattern: Repository Factory)
  private get transactionRepository() {
    return RepositoryFactory.getRepository(Transaction);
  }
  private get exerciceMembreRepository() {
    return RepositoryFactory.getRepository(ExerciceMembre);
  }
  private get reunionRepository() {
    return RepositoryFactory.getRepository(Reunion);
  }

  /**
   * Creer une transaction (Design Pattern: Builder)
   */
  async create(dto: CreateTransactionDto): Promise<TransactionResponseDto> {
    // Verifier le membre si fourni
    if (dto.exerciceMembreId) {
      const membre = await this.exerciceMembreRepository.findOne({
        where: { id: dto.exerciceMembreId },
      });
      if (!membre) {
        throw new NotFoundError(`Membre d'exercice non trouve: ${dto.exerciceMembreId}`);
      }
    }

    // Verifier la reunion si fournie
    if (dto.reunionId) {
      const reunion = await this.reunionRepository.findOne({ where: { id: dto.reunionId } });
      if (!reunion) {
        throw new NotFoundError(`Reunion non trouvee: ${dto.reunionId}`);
      }
    }

    // Construction via Builder
    const builder = new TransactionBuilder(dto.typeTransaction).withMontant(dto.montant);

    if (dto.exerciceMembreId) builder.forMembre(dto.exerciceMembreId);
    if (dto.reunionId) builder.atReunion(dto.reunionId);
    if (dto.projetId) builder.forProjet(dto.projetId);
    if (dto.description) builder.withDescription(dto.description);
    if (dto.modeCreation) builder.withModeCreation(dto.modeCreation);
    if (dto.autoSoumis) builder.autoSoumettre();
    builder.creePar(dto.creeParUtilisateurId, dto.creeParExerciceMembreId);

    const transaction = this.transactionRepository.create(builder.build());

    const saved = await this.transactionRepository.save(transaction);
    return this.findById(saved.id);
  }

  /**
   * Creer une cotisation
   */
  async createCotisation(dto: CreateCotisationDto): Promise<TransactionResponseDto> {
    // Validation du montant minimum via les règles
    const reunion = await this.reunionRepository.findOne({ where: { id: dto.reunionId } });
    if (reunion) {
      const minCotisation = await regleExerciceService.getEffectiveValueByCle(
        reunion.exerciceId,
        'COTISATION_MENSUELLE_MIN'
      );
      if (minCotisation && dto.montant < Number(minCotisation)) {
        throw new BadRequestError(
          `Le montant de la cotisation doit être au moins de ${minCotisation} FCFA`
        );
      }
    }

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
    // Validation du montant exact/minimum via les règles
    const reunion = await this.reunionRepository.findOne({ where: { id: dto.reunionId } });
    if (reunion) {
      const montantPot = await regleExerciceService.getEffectiveValueByCle(
        reunion.exerciceId,
        'POT_MENSUEL_MONTANT'
      );
      // On peut être strict (exactement le montant) ou souple (au moins le montant)
      // Ici on choisit "au moins" pour permettre les rattrapages ou avances,
      // mais idéalement le pot est fixe. Disons "au moins" pour la flexibilité.
      if (montantPot && dto.montant < Number(montantPot)) {
        throw new BadRequestError(`Le montant du pot doit être au moins de ${montantPot} FCFA`);
      }
    }

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
      description: "Frais d'inscription",
      modeCreation: dto.modeCreation,
      creeParExerciceMembreId: dto.creeParExerciceMembreId,
      autoSoumis: dto.autoSoumis,
    });
  }

  /**
   * Soumettre une transaction
   */
  async soumettre(id: string): Promise<TransactionResponseDto> {
    const transaction = await this.transactionRepository.findOne({ where: { id } });
    if (!transaction) {
      throw new NotFoundError(`Transaction non trouvee: ${id}`);
    }

    transactionStateMachine.assertTransition(transaction.statut, StatutTransaction.SOUMIS);

    transaction.statut = StatutTransaction.SOUMIS;
    transaction.soumisLe = new Date();

    await this.transactionRepository.save(transaction);
    return this.findById(id);
  }

  /**
   * Valider une transaction
   */
  /**
   * Valider une transaction
   */
  async valider(id: string, dto: ValiderTransactionDto): Promise<TransactionResponseDto> {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const transaction = await queryRunner.manager.findOne(Transaction, { where: { id } });
      if (!transaction) {
        throw new NotFoundError(`Transaction non trouvee: ${id}`);
      }

      transactionStateMachine.assertTransition(transaction.statut, StatutTransaction.VALIDE);

      transaction.statut = StatutTransaction.VALIDE;
      transaction.valideLe = new Date();
      transaction.valideParExerciceMembreId = dto.valideParExerciceMembreId;

      await queryRunner.manager.save(transaction);

      // INTEGRITE FINANCIERE: Mettre à jour les dettes selon le type de transaction
      // Toutes ces opérations font partie de la même transaction ACID
      if (transaction.reunionId && transaction.exerciceMembreId) {
        const montant = Number(transaction.montant);

        switch (transaction.typeTransaction) {
          case TypeTransaction.COTISATION:
            await cotisationDueService.payerParContexte(
              transaction.reunionId,
              transaction.exerciceMembreId,
              montant,
              queryRunner.manager
            );
            break;

          case TypeTransaction.EPARGNE:
            await epargneDueService.payerParContexte(
              transaction.reunionId,
              transaction.exerciceMembreId,
              montant,
              queryRunner.manager
            );
            break;

          case TypeTransaction.POT:
            // Les pots dus utilisent un ID direct, pas un contexte réunion+membre
            // On cherche le pot dû correspondant via le contexte
            try {
              const { PotDuMensuel } = await import('../entities/pot-du-mensuel.entity');
              const potDu = await queryRunner.manager.findOne(PotDuMensuel, {
                where: {
                  reunionId: transaction.reunionId,
                  exerciceMembreId: transaction.exerciceMembreId,
                },
              });
              if (potDu) {
                await potDuService.enregistrerPaiement(potDu.id, { montantPaye: montant });
              }
            } catch {
              // Silencieux si pas de pot dû trouvé
            }
            break;

          case TypeTransaction.INSCRIPTION:
            // Les inscriptions sont liées à l'exerciceMembre, pas à une réunion
            try {
              const { InscriptionDueExercice } =
                await import('../entities/inscription-due-exercice.entity');
              const inscriptionDue = await queryRunner.manager.findOne(InscriptionDueExercice, {
                where: { exerciceMembreId: transaction.exerciceMembreId },
              });
              if (inscriptionDue) {
                await inscriptionDueService.payer(inscriptionDue.id, { montantPaye: montant });
              }
            } catch {
              // Silencieux si pas d'inscription due trouvée
            }
            break;
        }
      }

      await queryRunner.commitTransaction();

      // Émettre un événement après le succès (Design Pattern: Observer)
      const result = await this.findById(id);
      eventBus.emit(AppEvents.TRANSACTION_VALIDATED, result);

      return result;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Rejeter une transaction
   */
  async rejeter(id: string, dto: RejeterTransactionDto): Promise<TransactionResponseDto> {
    const transaction = await this.transactionRepository.findOne({ where: { id } });
    if (!transaction) {
      throw new NotFoundError(`Transaction non trouvee: ${id}`);
    }

    transactionStateMachine.assertTransition(transaction.statut, StatutTransaction.REJETE);

    transaction.statut = StatutTransaction.REJETE;
    transaction.rejeteLe = new Date();
    transaction.rejeteParExerciceMembreId = dto.rejeteParExerciceMembreId;
    transaction.motifRejet = dto.motifRejet;

    await this.transactionRepository.save(transaction);
    return this.findById(id);
  }

  /**
   * Annuler une transaction
   */
  async annuler(id: string): Promise<TransactionResponseDto> {
    const transaction = await this.transactionRepository.findOne({ where: { id } });
    if (!transaction) {
      throw new NotFoundError(`Transaction non trouvee: ${id}`);
    }

    if (transaction.statut === StatutTransaction.VALIDE) {
      throw new BadRequestError('Une transaction validee ne peut pas etre annulee');
    }

    transaction.statut = StatutTransaction.ANNULE;

    await this.transactionRepository.save(transaction);
    return this.findById(id);
  }

  /**
   * Lister les transactions
   */
  async findAll(
    filters?: TransactionFiltersDto,
    pagination?: PaginationQuery
  ): Promise<PaginatedResult<TransactionResponseDto>> {
    const queryBuilder = this.transactionRepository
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
      queryBuilder.andWhere('t.exerciceMembreId = :exerciceMembreId', {
        exerciceMembreId: filters.exerciceMembreId,
      });
    }
    if (filters?.typeTransaction) {
      queryBuilder.andWhere('t.typeTransaction = :typeTransaction', {
        typeTransaction: filters.typeTransaction,
      });
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

    queryBuilder.orderBy('t.creeLe', 'DESC');

    const result = await paginate(queryBuilder, pagination || {});

    return {
      data: result.data.map((t) => this.toResponseDto(t)),
      meta: result.meta,
    };
  }

  /**
   * Trouver une transaction par ID
   */
  async findById(id: string): Promise<TransactionResponseDto> {
    const transaction = await this.transactionRepository.findOne({
      where: { id },
      relations: [
        'exerciceMembre',
        'exerciceMembre.adhesionTontine',
        'exerciceMembre.adhesionTontine.utilisateur',
        'projet',
      ],
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
    const transaction = await this.transactionRepository.findOne({
      where: { reference },
      relations: [
        'exerciceMembre',
        'exerciceMembre.adhesionTontine',
        'exerciceMembre.adhesionTontine.utilisateur',
        'projet',
      ],
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
    const transaction = await this.transactionRepository.findOne({ where: { id } });
    if (!transaction) {
      throw new NotFoundError(`Transaction non trouvee: ${id}`);
    }

    if (transaction.statut !== StatutTransaction.BROUILLON) {
      throw new BadRequestError('Seule une transaction en brouillon peut etre modifiee');
    }

    if (dto.montant !== undefined) transaction.montant = dto.montant;
    if (dto.description !== undefined) transaction.description = dto.description;
    if (dto.projetId !== undefined) transaction.projetId = dto.projetId;

    await this.transactionRepository.save(transaction);
    return this.findById(id);
  }

  /**
   * Supprimer une transaction
   */
  async delete(id: string): Promise<void> {
    const transaction = await this.transactionRepository.findOne({ where: { id } });
    if (!transaction) {
      throw new NotFoundError(`Transaction non trouvee: ${id}`);
    }

    if (transaction.statut !== StatutTransaction.BROUILLON) {
      throw new BadRequestError('Seule une transaction en brouillon peut etre supprimee');
    }

    await this.transactionRepository.remove(transaction);
  }

  /**
   * Obtenir le resume des transactions (utilise des agregations SQL pour la performance)
   */
  async getSummary(filters?: TransactionFiltersDto): Promise<TransactionsSummaryDto> {
    const queryBuilder = this.transactionRepository
      .createQueryBuilder('t')
      .leftJoin('t.exerciceMembre', 'em');

    if (filters?.reunionId) {
      queryBuilder.andWhere('t.reunionId = :reunionId', { reunionId: filters.reunionId });
    }
    if (filters?.exerciceId) {
      queryBuilder.andWhere('em.exerciceId = :exerciceId', { exerciceId: filters.exerciceId });
    }
    if (filters?.exerciceMembreId) {
      queryBuilder.andWhere('t.exerciceMembreId = :exerciceMembreId', {
        exerciceMembreId: filters.exerciceMembreId,
      });
    }
    if (filters?.typeTransaction) {
      queryBuilder.andWhere('t.typeTransaction = :typeTransaction', {
        typeTransaction: filters.typeTransaction,
      });
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

    // Agregation par type
    const parTypeRaw = await queryBuilder
      .clone()
      .select('t.typeTransaction', 'type')
      .addSelect('COUNT(*)', 'count')
      .addSelect('COALESCE(SUM(t.montant), 0)', 'montant')
      .groupBy('t.typeTransaction')
      .getRawMany();

    // Agregation par statut
    const parStatutRaw = await queryBuilder
      .clone()
      .select('t.statut', 'statut')
      .addSelect('COUNT(*)', 'count')
      .addSelect('COALESCE(SUM(t.montant), 0)', 'montant')
      .groupBy('t.statut')
      .getRawMany();

    // Total global
    const totalRaw = await queryBuilder
      .clone()
      .select('COUNT(*)', 'totalTransactions')
      .addSelect('COALESCE(SUM(t.montant), 0)', 'totalMontant')
      .getRawOne();

    return {
      totalTransactions: parseInt(totalRaw?.totalTransactions) || 0,
      totalMontant: parseFloat(totalRaw?.totalMontant) || 0,
      parType: parTypeRaw.map((r: any) => ({
        type: r.type as TypeTransaction,
        count: parseInt(r.count) || 0,
        montant: parseFloat(r.montant) || 0,
      })),
      parStatut: parStatutRaw.map((r: any) => ({
        statut: r.statut as StatutTransaction,
        count: parseInt(r.count) || 0,
        montant: parseFloat(r.montant) || 0,
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
      exerciceMembre: entity.exerciceMembre
        ? {
            id: entity.exerciceMembre.id,
            utilisateurId: utilisateur?.id || '',
            utilisateurNom: utilisateur ? `${utilisateur.prenom} ${utilisateur.nom}` : undefined,
          }
        : null,
      projetId: entity.projetId,
      projet: entity.projet
        ? {
            id: entity.projet.id,
            nom: entity.projet.nom,
          }
        : null,
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
