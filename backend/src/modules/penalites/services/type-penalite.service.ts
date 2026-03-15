/**
 * Service pour la gestion des types de penalite
 */

import { Repository } from 'typeorm';
import { AppDataSource } from '../../../config';
import { NotFoundError, BadRequestError } from '../../../shared';
import { TypePenalite } from '../entities/type-penalite.entity';
import {
  CreateTypePenaliteDto,
  UpdateTypePenaliteDto,
  TypePenaliteResponseDto,
} from '../dto/type-penalite.dto';

export class TypePenaliteService {
  private _repo?: Repository<TypePenalite>;

  private get typePenaliteRepository(): Repository<TypePenalite> {
    if (!this._repo) this._repo = AppDataSource.getRepository(TypePenalite);
    return this._repo;
  }

  /**
   * Creer un nouveau type de penalite
   */
  async create(dto: CreateTypePenaliteDto): Promise<TypePenaliteResponseDto> {
    // Verifier l'unicite du code
    const existing = await this.typePenaliteRepository.findOne({ where: { code: dto.code } });
    if (existing) {
      throw new BadRequestError(`Un type de penalite avec le code "${dto.code}" existe deja`);
    }

    const typePenalite = this.typePenaliteRepository.create({
      code: dto.code,
      libelle: dto.libelle,
      description: dto.description || null,
      modeCalcul: dto.modeCalcul,
      valeurDefaut: dto.valeurDefaut || null,
      estActif: dto.estActif !== undefined ? dto.estActif : true,
    });

    const saved = await this.typePenaliteRepository.save(typePenalite);
    return this.toResponseDto(saved);
  }

  /**
   * Lister tous les types de penalite
   */
  async findAll(includeInactive = false): Promise<TypePenaliteResponseDto[]> {
    const queryBuilder = this.typePenaliteRepository.createQueryBuilder('tp');

    if (!includeInactive) {
      queryBuilder.where('tp.estActif = :estActif', { estActif: true });
    }

    const types = await queryBuilder.orderBy('tp.libelle', 'ASC').getMany();
    return types.map((t: TypePenalite) => this.toResponseDto(t));
  }

  /**
   * Trouver un type de penalite par ID
   */
  async findById(id: string): Promise<TypePenaliteResponseDto> {
    const typePenalite = await this.typePenaliteRepository.findOne({ where: { id } });
    if (!typePenalite) {
      throw new NotFoundError(`Type de penalite non trouve: ${id}`);
    }
    return this.toResponseDto(typePenalite);
  }

  /**
   * Trouver un type de penalite par code
   */
  async findByCode(code: string): Promise<TypePenaliteResponseDto> {
    const typePenalite = await this.typePenaliteRepository.findOne({ where: { code } });
    if (!typePenalite) {
      throw new NotFoundError(`Type de penalite non trouve: ${code}`);
    }
    return this.toResponseDto(typePenalite);
  }

  /**
   * Mettre a jour un type de penalite
   */
  async update(id: string, dto: UpdateTypePenaliteDto): Promise<TypePenaliteResponseDto> {
    const typePenalite = await this.typePenaliteRepository.findOne({ where: { id } });
    if (!typePenalite) {
      throw new NotFoundError(`Type de penalite non trouve: ${id}`);
    }

    if (dto.libelle !== undefined) typePenalite.libelle = dto.libelle;
    if (dto.description !== undefined) typePenalite.description = dto.description;
    if (dto.modeCalcul !== undefined) typePenalite.modeCalcul = dto.modeCalcul;
    if (dto.valeurDefaut !== undefined) typePenalite.valeurDefaut = dto.valeurDefaut;
    if (dto.estActif !== undefined) typePenalite.estActif = dto.estActif;

    const saved = await this.typePenaliteRepository.save(typePenalite);
    return this.toResponseDto(saved);
  }

  /**
   * Supprimer un type de penalite (soft delete)
   */
  async delete(id: string): Promise<void> {
    const typePenalite = await this.typePenaliteRepository.findOne({ where: { id } });
    if (!typePenalite) {
      throw new NotFoundError(`Type de penalite non trouve: ${id}`);
    }

    await this.typePenaliteRepository.softRemove(typePenalite);
  }

  /**
   * Transformer en DTO de reponse
   */
  private toResponseDto(entity: TypePenalite): TypePenaliteResponseDto {
    return {
      id: entity.id,
      code: entity.code,
      libelle: entity.libelle,
      description: entity.description,
      modeCalcul: entity.modeCalcul,
      valeurDefaut: entity.valeurDefaut,
      estActif: entity.estActif,
      creeLe: entity.creeLe,
    };
  }
}

export const typePenaliteService = new TypePenaliteService();
