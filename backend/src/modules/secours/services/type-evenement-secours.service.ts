/**
 * Service pour la gestion des types d'evenements de secours
 */

import { Repository } from 'typeorm';
import { AppDataSource } from '../../../config';
import { NotFoundError, BadRequestError } from '../../../shared';
import { TypeEvenementSecours } from '../entities/type-evenement-secours.entity';
import {
  CreateTypeEvenementSecoursDto,
  UpdateTypeEvenementSecoursDto,
  TypeEvenementSecoursResponseDto,
} from '../dto/type-evenement-secours.dto';

export class TypeEvenementSecoursService {
  private _repo?: Repository<TypeEvenementSecours>;

  private get typeEvenementSecoursRepository(): Repository<TypeEvenementSecours> {
    if (!this._repo) this._repo = AppDataSource.getRepository(TypeEvenementSecours);
    return this._repo;
  }

  /**
   * Creer un nouveau type d'evenement de secours
   */
  async create(dto: CreateTypeEvenementSecoursDto): Promise<TypeEvenementSecoursResponseDto> {
    // Verifier l'unicite du code
    const existing = await this.typeEvenementSecoursRepository.findOne({ where: { code: dto.code } });
    if (existing) {
      throw new BadRequestError(`Un type d'evenement de secours avec le code "${dto.code}" existe deja`);
    }

    const typeEvenement = this.typeEvenementSecoursRepository.create({
      code: dto.code,
      libelle: dto.libelle,
      description: dto.description || null,
      montantParDefaut: dto.montantParDefaut || null,
      ordreAffichage: dto.ordreAffichage || 0,
      estActif: dto.estActif !== undefined ? dto.estActif : true,
    });

    const saved = await this.typeEvenementSecoursRepository.save(typeEvenement);
    return this.toResponseDto(saved);
  }

  /**
   * Lister tous les types d'evenement de secours
   */
  async findAll(includeInactive = false): Promise<TypeEvenementSecoursResponseDto[]> {
    const queryBuilder = this.typeEvenementSecoursRepository.createQueryBuilder('te');

    if (!includeInactive) {
      queryBuilder.where('te.estActif = :estActif', { estActif: true });
    }

    const types = await queryBuilder.orderBy('te.ordreAffichage', 'ASC').getMany();
    return types.map((t: TypeEvenementSecours) => this.toResponseDto(t));
  }

  /**
   * Trouver un type d'evenement de secours par ID
   */
  async findById(id: string): Promise<TypeEvenementSecoursResponseDto> {
    const typeEvenement = await this.typeEvenementSecoursRepository.findOne({ where: { id } });
    if (!typeEvenement) {
      throw new NotFoundError(`Type d'evenement de secours non trouve: ${id}`);
    }
    return this.toResponseDto(typeEvenement);
  }

  /**
   * Mettre a jour un type d'evenement de secours
   */
  async update(id: string, dto: UpdateTypeEvenementSecoursDto): Promise<TypeEvenementSecoursResponseDto> {
    const typeEvenement = await this.typeEvenementSecoursRepository.findOne({ where: { id } });
    if (!typeEvenement) {
      throw new NotFoundError(`Type d'evenement de secours non trouve: ${id}`);
    }

    if (dto.libelle !== undefined) typeEvenement.libelle = dto.libelle;
    if (dto.description !== undefined) typeEvenement.description = dto.description;
    if (dto.montantParDefaut !== undefined) typeEvenement.montantParDefaut = dto.montantParDefaut;
    if (dto.ordreAffichage !== undefined) typeEvenement.ordreAffichage = dto.ordreAffichage;
    if (dto.estActif !== undefined) typeEvenement.estActif = dto.estActif;

    const saved = await this.typeEvenementSecoursRepository.save(typeEvenement);
    return this.toResponseDto(saved);
  }

  /**
   * Supprimer un type d'evenement de secours (soft delete)
   */
  async delete(id: string): Promise<void> {
    const typeEvenement = await this.typeEvenementSecoursRepository.findOne({ where: { id } });
    if (!typeEvenement) {
      throw new NotFoundError(`Type d'evenement de secours non trouve: ${id}`);
    }

    await this.typeEvenementSecoursRepository.softRemove(typeEvenement);
  }

  /**
   * Transformer en DTO de reponse
   */
  private toResponseDto(entity: TypeEvenementSecours): TypeEvenementSecoursResponseDto {
    return {
      id: entity.id,
      code: entity.code,
      libelle: entity.libelle,
      description: entity.description,
      montantParDefaut: entity.montantParDefaut,
      ordreAffichage: entity.ordreAffichage,
      estActif: entity.estActif,
      creeLe: entity.creeLe,
    };
  }
}

export const typeEvenementSecoursService = new TypeEvenementSecoursService();
