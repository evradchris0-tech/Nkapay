/**
 * Service pour la gestion des operateurs de paiement
 */

import { AppDataSource } from '../../../config';
import { NotFoundError, BadRequestError } from '../../../shared';
import { OperateurPaiement } from '../entities/operateur-paiement.entity';
import {
  CreateOperateurPaiementDto,
  UpdateOperateurPaiementDto,
  OperateurPaiementResponseDto,
} from '../dto/operateur-paiement.dto';

const operateurRepository = AppDataSource.getRepository(OperateurPaiement);

export class OperateurPaiementService {
  /**
   * Creer un operateur de paiement
   */
  async create(dto: CreateOperateurPaiementDto): Promise<OperateurPaiementResponseDto> {
    // Verifier l'unicite du code
    const existing = await operateurRepository.findOne({ where: { code: dto.code } });
    if (existing) {
      throw new BadRequestError(`Un operateur avec le code "${dto.code}" existe deja`);
    }

    const operateur = operateurRepository.create({
      code: dto.code.toUpperCase(),
      nom: dto.nom,
      logoUrl: dto.logoUrl || null,
      estActif: dto.estActif ?? true,
      configApi: dto.configApi || null,
      fraisFixe: dto.fraisFixe || 0,
      fraisPourcentage: dto.fraisPourcentage || 0,
    });

    const saved = await operateurRepository.save(operateur);
    return this.toResponseDto(saved);
  }

  /**
   * Lister les operateurs de paiement
   */
  async findAll(actifSeulement: boolean = false): Promise<OperateurPaiementResponseDto[]> {
    const where = actifSeulement ? { estActif: true } : {};
    const operateurs = await operateurRepository.find({
      where,
      order: { nom: 'ASC' },
    });
    return operateurs.map((o) => this.toResponseDto(o));
  }

  /**
   * Trouver un operateur par ID
   */
  async findById(id: string): Promise<OperateurPaiementResponseDto> {
    const operateur = await operateurRepository.findOne({ where: { id } });
    if (!operateur) {
      throw new NotFoundError(`Operateur non trouve: ${id}`);
    }
    return this.toResponseDto(operateur);
  }

  /**
   * Trouver un operateur par code
   */
  async findByCode(code: string): Promise<OperateurPaiementResponseDto> {
    const operateur = await operateurRepository.findOne({ where: { code: code.toUpperCase() } });
    if (!operateur) {
      throw new NotFoundError(`Operateur non trouve: ${code}`);
    }
    return this.toResponseDto(operateur);
  }

  /**
   * Mettre a jour un operateur
   */
  async update(id: string, dto: UpdateOperateurPaiementDto): Promise<OperateurPaiementResponseDto> {
    const operateur = await operateurRepository.findOne({ where: { id } });
    if (!operateur) {
      throw new NotFoundError(`Operateur non trouve: ${id}`);
    }

    if (dto.nom !== undefined) operateur.nom = dto.nom;
    if (dto.logoUrl !== undefined) operateur.logoUrl = dto.logoUrl || null;
    if (dto.estActif !== undefined) operateur.estActif = dto.estActif;
    if (dto.configApi !== undefined) operateur.configApi = dto.configApi || null;
    if (dto.fraisFixe !== undefined) operateur.fraisFixe = dto.fraisFixe;
    if (dto.fraisPourcentage !== undefined) operateur.fraisPourcentage = dto.fraisPourcentage;

    const saved = await operateurRepository.save(operateur);
    return this.toResponseDto(saved);
  }

  /**
   * Supprimer un operateur
   */
  async delete(id: string): Promise<void> {
    const operateur = await operateurRepository.findOne({ where: { id } });
    if (!operateur) {
      throw new NotFoundError(`Operateur non trouve: ${id}`);
    }
    await operateurRepository.remove(operateur);
  }

  /**
   * Transformer en DTO de reponse
   */
  private toResponseDto(entity: OperateurPaiement): OperateurPaiementResponseDto {
    return {
      id: entity.id,
      code: entity.code,
      nom: entity.nom,
      logoUrl: entity.logoUrl,
      estActif: entity.estActif,
      fraisFixe: Number(entity.fraisFixe),
      fraisPourcentage: Number(entity.fraisPourcentage),
      creeLe: entity.creeLe,
      modifieLe: entity.modifieLe,
    };
  }
}

export const operateurPaiementService = new OperateurPaiementService();
