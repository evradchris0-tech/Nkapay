/**
 * Service pour la gestion des paiements mobiles
 */

import { Repository } from 'typeorm';
import { AppDataSource } from '../../../config';
import { NotFoundError, BadRequestError } from '../../../shared';
import {
  PaiementMobile,
  StatutPaiementMobile,
  OperateurMobile,
} from '../entities/paiement-mobile.entity';
import { Transaction } from '../entities/transaction.entity';
import {
  CreatePaiementMobileDto,
  UpdatePaiementMobileDto,
  PaiementMobileResponseDto,
  PaiementMobileFiltersDto,
} from '../dto/paiement-mobile.dto';

export class PaiementMobileService {
  private _paiementRepo?: Repository<PaiementMobile>;
  private _transactionRepo?: Repository<Transaction>;

  private get paiementMobileRepository(): Repository<PaiementMobile> {
    if (!this._paiementRepo) this._paiementRepo = AppDataSource.getRepository(PaiementMobile);
    return this._paiementRepo;
  }

  private get transactionRepository(): Repository<Transaction> {
    if (!this._transactionRepo) this._transactionRepo = AppDataSource.getRepository(Transaction);
    return this._transactionRepo;
  }

  /**
   * Créer un nouveau paiement mobile (initier)
   */
  async initier(data: CreatePaiementMobileDto): Promise<PaiementMobileResponseDto> {
    return this.create(data);
  }

  /**
   * Créer un nouveau paiement mobile
   */
  async create(data: CreatePaiementMobileDto): Promise<PaiementMobileResponseDto> {
    const transaction = await this.transactionRepository.findOne({
      where: { id: data.transactionId },
    });

    if (!transaction) {
      throw new NotFoundError('Transaction non trouvée');
    }

    const paiement = this.paiementMobileRepository.create({
      transactionId: data.transactionId,
      operateur: data.operateur,
      numeroTelephone: data.numeroTelephone,
      statut: StatutPaiementMobile.EN_ATTENTE,
    });

    await this.paiementMobileRepository.save(paiement);
    return this.findById(paiement.id);
  }

  /**
   * Récupérer tous les paiements avec filtres et pagination
   */
  async findAll(
    filters?: PaiementMobileFiltersDto,
    page: number = 1,
    limit: number = 20
  ): Promise<{ data: PaiementMobileResponseDto[]; total: number; page: number; limit: number }> {
    const queryBuilder = this.paiementMobileRepository
      .createQueryBuilder('paiement')
      .leftJoinAndSelect('paiement.transaction', 'transaction');

    if (filters?.transactionId) {
      queryBuilder.andWhere('paiement.transactionId = :transactionId', {
        transactionId: filters.transactionId,
      });
    }

    if (filters?.operateur) {
      queryBuilder.andWhere('paiement.operateur = :operateur', {
        operateur: filters.operateur,
      });
    }

    if (filters?.statut) {
      queryBuilder.andWhere('paiement.statut = :statut', {
        statut: filters.statut,
      });
    }

    if (filters?.dateDebut) {
      queryBuilder.andWhere('paiement.dateInitiation >= :dateDebut', {
        dateDebut: filters.dateDebut,
      });
    }

    if (filters?.dateFin) {
      queryBuilder.andWhere('paiement.dateInitiation <= :dateFin', {
        dateFin: filters.dateFin,
      });
    }

    queryBuilder.orderBy('paiement.dateInitiation', 'DESC');

    const total = await queryBuilder.getCount();
    const paiements = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    return {
      data: paiements.map((p: PaiementMobile) => this.formatResponse(p)),
      total,
      page,
      limit,
    };
  }

  /**
   * Récupérer les paiements en attente
   */
  async findPending(): Promise<PaiementMobileResponseDto[]> {
    const paiements = await this.paiementMobileRepository.find({
      where: { statut: StatutPaiementMobile.EN_ATTENTE },
      relations: ['transaction'],
      order: { dateInitiation: 'ASC' },
    });
    return paiements.map((p: PaiementMobile) => this.formatResponse(p));
  }

  /**
   * Récupérer un paiement par ID
   */
  async findById(id: string): Promise<PaiementMobileResponseDto> {
    const paiement = await this.paiementMobileRepository.findOne({
      where: { id },
      relations: ['transaction'],
    });

    if (!paiement) {
      throw new NotFoundError('Paiement mobile non trouvé');
    }

    return this.formatResponse(paiement);
  }

  /**
   * Récupérer les paiements d'une transaction
   */
  async findByTransaction(transactionId: string): Promise<PaiementMobileResponseDto[]> {
    const paiements = await this.paiementMobileRepository.find({
      where: { transactionId },
      relations: ['transaction'],
      order: { dateInitiation: 'DESC' },
    });
    return paiements.map((p: PaiementMobile) => this.formatResponse(p));
  }

  /**
   * Marquer un paiement comme envoyé
   */
  async marquerEnvoye(id: string, referenceExterne?: string): Promise<PaiementMobileResponseDto> {
    const paiement = await this.paiementMobileRepository.findOne({
      where: { id },
    });

    if (!paiement) {
      throw new NotFoundError('Paiement mobile non trouvé');
    }

    if (paiement.statut !== StatutPaiementMobile.EN_ATTENTE) {
      throw new BadRequestError('Seuls les paiements en attente peuvent être envoyés');
    }

    paiement.statut = StatutPaiementMobile.ENVOYE;
    if (referenceExterne) {
      paiement.referenceExterne = referenceExterne;
    }

    await this.paiementMobileRepository.save(paiement);
    return this.findById(id);
  }

  /**
   * Confirmer un paiement
   */
  async confirmer(id: string, codeConfirmation?: string): Promise<PaiementMobileResponseDto> {
    const paiement = await this.paiementMobileRepository.findOne({
      where: { id },
    });

    if (!paiement) {
      throw new NotFoundError('Paiement mobile non trouvé');
    }

    if (
      paiement.statut !== StatutPaiementMobile.EN_ATTENTE &&
      paiement.statut !== StatutPaiementMobile.ENVOYE
    ) {
      throw new BadRequestError('Ce paiement ne peut pas être confirmé');
    }

    paiement.statut = StatutPaiementMobile.CONFIRME;
    paiement.dateConfirmation = new Date();
    if (codeConfirmation) {
      paiement.codeConfirmation = codeConfirmation;
    }

    await this.paiementMobileRepository.save(paiement);
    return this.findById(id);
  }

  /**
   * Marquer un paiement comme échoué
   */
  async marquerEchoue(id: string, erreur?: string): Promise<PaiementMobileResponseDto> {
    const paiement = await this.paiementMobileRepository.findOne({
      where: { id },
    });

    if (!paiement) {
      throw new NotFoundError('Paiement mobile non trouvé');
    }

    if (paiement.statut === StatutPaiementMobile.CONFIRME) {
      throw new BadRequestError('Un paiement confirmé ne peut pas être marqué comme échoué');
    }

    paiement.statut = StatutPaiementMobile.ECHOUE;
    if (erreur) {
      paiement.erreur = erreur;
    }

    await this.paiementMobileRepository.save(paiement);
    return this.findById(id);
  }

  /**
   * Annuler un paiement
   */
  async annuler(id: string, raison?: string): Promise<PaiementMobileResponseDto> {
    const paiement = await this.paiementMobileRepository.findOne({
      where: { id },
    });

    if (!paiement) {
      throw new NotFoundError('Paiement mobile non trouvé');
    }

    if (paiement.statut === StatutPaiementMobile.CONFIRME) {
      throw new BadRequestError('Un paiement confirmé ne peut pas être annulé');
    }

    paiement.statut = StatutPaiementMobile.ANNULE;
    if (raison) {
      paiement.erreur = raison;
    }

    await this.paiementMobileRepository.save(paiement);
    return this.findById(id);
  }

  /**
   * Statistiques des paiements (alias)
   */
  async getStatsByOperateur(): Promise<{
    total: number;
    enAttente: number;
    envoyes: number;
    confirmes: number;
    echoues: number;
    annules: number;
    parOperateur: Record<string, number>;
  }> {
    return this.getStats();
  }

  /**
   * Statistiques des paiements
   */
  async getStats(
    dateDebut?: Date,
    dateFin?: Date
  ): Promise<{
    total: number;
    enAttente: number;
    envoyes: number;
    confirmes: number;
    echoues: number;
    annules: number;
    parOperateur: Record<string, number>;
  }> {
    const queryBuilder = this.paiementMobileRepository.createQueryBuilder('paiement');

    if (dateDebut) {
      queryBuilder.andWhere('paiement.dateInitiation >= :dateDebut', { dateDebut });
    }
    if (dateFin) {
      queryBuilder.andWhere('paiement.dateInitiation <= :dateFin', { dateFin });
    }

    const paiements = await queryBuilder.getMany();

    const stats = {
      total: paiements.length,
      enAttente: 0,
      envoyes: 0,
      confirmes: 0,
      echoues: 0,
      annules: 0,
      parOperateur: {} as Record<string, number>,
    };

    paiements.forEach((p: PaiementMobile) => {
      switch (p.statut) {
        case StatutPaiementMobile.EN_ATTENTE:
          stats.enAttente++;
          break;
        case StatutPaiementMobile.ENVOYE:
          stats.envoyes++;
          break;
        case StatutPaiementMobile.CONFIRME:
          stats.confirmes++;
          break;
        case StatutPaiementMobile.ECHOUE:
          stats.echoues++;
          break;
        case StatutPaiementMobile.ANNULE:
          stats.annules++;
          break;
      }

      stats.parOperateur[p.operateur] = (stats.parOperateur[p.operateur] || 0) + 1;
    });

    return stats;
  }

  private formatResponse(paiement: PaiementMobile): PaiementMobileResponseDto {
    // Get montant from related transaction
    const montant = paiement.transaction?.montant || 0;

    return {
      id: paiement.id,
      transactionId: paiement.transactionId,
      operateur: paiement.operateur,
      numeroTelephone: paiement.numeroTelephone,
      montant: Number(montant),
      statut: paiement.statut,
      referenceOperateur: paiement.referenceExterne || null,
      messageOperateur: paiement.erreur || null,
      dateEnvoi: paiement.dateInitiation,
      dateConfirmation: paiement.dateConfirmation || null,
      creeLe: paiement.dateInitiation,
    };
  }
}

export const paiementMobileService = new PaiementMobileService();
