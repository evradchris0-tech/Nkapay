/**
 * Service pour la gestion des remboursements de prets
 */

import { Repository } from 'typeorm';
import { AppDataSource } from '../../../config';
import { NotFoundError, BadRequestError } from '../../../shared';
import { RemboursementPret } from '../entities/remboursement-pret.entity';
import { Pret, StatutPret } from '../entities/pret.entity';
import { Reunion } from '../../reunions/entities/reunion.entity';
import { CreateRemboursementDto, RemboursementPretResponseDto } from '../dto/pret.dto';

export class RemboursementPretService {
  private _remboursementRepo?: Repository<RemboursementPret>;
  private _pretRepo?: Repository<Pret>;
  private _reunionRepo?: Repository<Reunion>;

  private get remboursementRepository(): Repository<RemboursementPret> {
    if (!this._remboursementRepo)
      this._remboursementRepo = AppDataSource.getRepository(RemboursementPret);
    return this._remboursementRepo;
  }

  private get pretRepository(): Repository<Pret> {
    if (!this._pretRepo) this._pretRepo = AppDataSource.getRepository(Pret);
    return this._pretRepo;
  }

  private get reunionRepository(): Repository<Reunion> {
    if (!this._reunionRepo) this._reunionRepo = AppDataSource.getRepository(Reunion);
    return this._reunionRepo;
  }

  /**
   * Creer un remboursement
   */
  async create(dto: CreateRemboursementDto): Promise<RemboursementPretResponseDto> {
    // Verifier le pret
    const pret = await this.pretRepository.findOne({ where: { id: dto.pretId } });
    if (!pret) {
      throw new NotFoundError(`Pret non trouve: ${dto.pretId}`);
    }

    if (pret.statut !== StatutPret.EN_COURS && pret.statut !== StatutPret.DECAISSE) {
      throw new BadRequestError('Le pret doit etre en cours pour accepter des remboursements');
    }

    // Verifier la reunion
    const reunion = await this.reunionRepository.findOne({ where: { id: dto.reunionId } });
    if (!reunion) {
      throw new NotFoundError(`Reunion non trouvee: ${dto.reunionId}`);
    }

    // Verifier que le montant ne depasse pas le capital restant
    if (dto.montantCapital > Number(pret.capitalRestant)) {
      throw new BadRequestError(
        `Le montant du capital (${dto.montantCapital}) depasse le capital restant (${pret.capitalRestant})`
      );
    }

    const montantInteret = dto.montantInteret || 0;
    const montantTotal = dto.montantCapital + montantInteret;
    const capitalRestantApres = Number(pret.capitalRestant) - dto.montantCapital;

    const remboursement = this.remboursementRepository.create({
      pretId: dto.pretId,
      reunionId: dto.reunionId,
      transactionId: dto.transactionId || null,
      montantCapital: dto.montantCapital,
      montantInteret,
      montantTotal,
      capitalRestantApres,
      commentaire: dto.commentaire || null,
    });

    const saved = await this.remboursementRepository.save(remboursement);

    // Mettre a jour le capital restant du pret
    pret.capitalRestant = capitalRestantApres;

    // Si le pret est decaisse, le passer en cours
    if (pret.statut === StatutPret.DECAISSE) {
      pret.statut = StatutPret.EN_COURS;
    }

    // Verifier si le pret est solde
    if (capitalRestantApres <= 0.01) {
      pret.capitalRestant = 0;
      pret.statut = StatutPret.SOLDE;
      pret.dateSolde = new Date();
    }

    await this.pretRepository.save(pret);

    return this.toResponseDto(saved);
  }

  /**
   * Lister les remboursements d'un pret
   */
  async findByPret(pretId: string): Promise<RemboursementPretResponseDto[]> {
    const remboursements = await this.remboursementRepository.find({
      where: { pretId },
      order: { dateRemboursement: 'DESC' },
    });
    return remboursements.map((r) => this.toResponseDto(r));
  }

  /**
   * Lister les remboursements d'une reunion
   */
  async findByReunion(reunionId: string): Promise<RemboursementPretResponseDto[]> {
    const remboursements = await this.remboursementRepository.find({
      where: { reunionId },
      relations: ['pret'],
      order: { dateRemboursement: 'DESC' },
    });
    return remboursements.map((r) => this.toResponseDto(r));
  }

  /**
   * Trouver un remboursement par ID
   */
  async findById(id: string): Promise<RemboursementPretResponseDto> {
    const remboursement = await this.remboursementRepository.findOne({ where: { id } });
    if (!remboursement) {
      throw new NotFoundError(`Remboursement non trouve: ${id}`);
    }
    return this.toResponseDto(remboursement);
  }

  /**
   * Supprimer un remboursement
   */
  async delete(id: string): Promise<void> {
    const remboursement = await this.remboursementRepository.findOne({ where: { id } });
    if (!remboursement) {
      throw new NotFoundError(`Remboursement non trouve: ${id}`);
    }

    // Recuperer le pret pour restaurer le capital
    const pret = await this.pretRepository.findOne({ where: { id: remboursement.pretId } });
    if (pret) {
      pret.capitalRestant = Number(pret.capitalRestant) + Number(remboursement.montantCapital);

      // Si le pret etait solde, le remettre en cours
      if (pret.statut === StatutPret.SOLDE) {
        pret.statut = StatutPret.EN_COURS;
        pret.dateSolde = null;
      }

      await this.pretRepository.save(pret);
    }

    await this.remboursementRepository.remove(remboursement);
  }

  /**
   * Transformer en DTO de reponse
   */
  private toResponseDto(entity: RemboursementPret): RemboursementPretResponseDto {
    return {
      id: entity.id,
      pretId: entity.pretId,
      reunionId: entity.reunionId,
      transactionId: entity.transactionId,
      montantCapital: Number(entity.montantCapital),
      montantInteret: Number(entity.montantInteret),
      montantTotal: Number(entity.montantTotal),
      dateRemboursement: entity.dateRemboursement,
      capitalRestantApres: Number(entity.capitalRestantApres),
      commentaire: entity.commentaire,
    };
  }
}

export const remboursementPretService = new RemboursementPretService();
