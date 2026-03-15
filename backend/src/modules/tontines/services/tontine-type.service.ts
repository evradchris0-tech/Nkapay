/**
 * Service pour la gestion des types de tontines
 */

import { Repository } from 'typeorm';
import { AppDataSource } from '../../../config';
import { NotFoundError, BadRequestError } from '../../../shared';
import { TontineType } from '../entities/tontine-type.entity';
import {
  CreateTontineTypeDto,
  UpdateTontineTypeDto,
  TontineTypeResponseDto,
} from '../dto/tontine-type.dto';

export class TontineTypeService {
  private _repo?: Repository<TontineType>;

  private get tontineTypeRepository(): Repository<TontineType> {
    if (!this._repo) this._repo = AppDataSource.getRepository(TontineType);
    return this._repo;
  }

  /**
   * Creer un nouveau type de tontine
   */
  async create(dto: CreateTontineTypeDto): Promise<TontineTypeResponseDto> {
    // Verifier l'unicite du code
    const existing = await this.tontineTypeRepository.findOne({
      where: { code: dto.code },
    });
    if (existing) {
      throw new BadRequestError(`Le code "${dto.code}" existe deja`);
    }

    const tontineType = this.tontineTypeRepository.create({
      code: dto.code,
      libelle: dto.libelle,
      description: dto.description || null,
      estActif: true,
    });

    const saved = await this.tontineTypeRepository.save(tontineType);
    return this.toResponseDto(saved);
  }

  /**
   * Lister tous les types de tontines
   */
  async findAll(actifOnly: boolean = false): Promise<TontineTypeResponseDto[]> {
    const where = actifOnly ? { estActif: true } : {};
    const types = await this.tontineTypeRepository.find({
      where,
      order: { libelle: 'ASC' },
    });
    return types.map((t) => this.toResponseDto(t));
  }

  /**
   * Trouver un type par ID
   */
  async findById(id: string): Promise<TontineTypeResponseDto> {
    const type = await this.tontineTypeRepository.findOne({ where: { id } });
    if (!type) {
      throw new NotFoundError(`Type de tontine non trouve: ${id}`);
    }
    return this.toResponseDto(type);
  }

  /**
   * Trouver un type par code
   */
  async findByCode(code: string): Promise<TontineTypeResponseDto> {
    const type = await this.tontineTypeRepository.findOne({ where: { code } });
    if (!type) {
      throw new NotFoundError(`Type de tontine non trouve avec le code: ${code}`);
    }
    return this.toResponseDto(type);
  }

  /**
   * Mettre a jour un type
   */
  async update(id: string, dto: UpdateTontineTypeDto): Promise<TontineTypeResponseDto> {
    const type = await this.tontineTypeRepository.findOne({ where: { id } });
    if (!type) {
      throw new NotFoundError(`Type de tontine non trouve: ${id}`);
    }

    if (dto.libelle !== undefined) type.libelle = dto.libelle;
    if (dto.description !== undefined) type.description = dto.description;
    if (dto.estActif !== undefined) type.estActif = dto.estActif;

    const updated = await this.tontineTypeRepository.save(type);
    return this.toResponseDto(updated);
  }

  /**
   * Desactiver un type de tontine (soft delete)
   */
  async deactivate(id: string): Promise<TontineTypeResponseDto> {
    const type = await this.tontineTypeRepository.findOne({ where: { id } });
    if (!type) {
      throw new NotFoundError(`Type de tontine non trouve: ${id}`);
    }

    type.estActif = false;
    const updated = await this.tontineTypeRepository.save(type);
    return this.toResponseDto(updated);
  }

  /**
   * Transformer l'entite en DTO de reponse
   */
  private toResponseDto(entity: TontineType): TontineTypeResponseDto {
    return {
      id: entity.id,
      code: entity.code,
      libelle: entity.libelle,
      description: entity.description,
      estActif: entity.estActif,
      creeLe: entity.creeLe,
    };
  }
}

export const tontineTypeService = new TontineTypeService();
