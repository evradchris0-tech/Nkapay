/**
 * Service pour la gestion des tontines
 */

import { AppDataSource } from '../../../config';
import { NotFoundError, BadRequestError } from '../../../shared';
import { Tontine, StatutTontine } from '../entities/tontine.entity';
import { TontineType } from '../entities/tontine-type.entity';
import { StatutExercice } from '../../exercices/entities/exercice.entity';
import {
  CreateTontineDto,
  UpdateTontineDto,
  TontineResponseDto,
  TontineListItemDto,
} from '../dto/tontine.dto';

const tontineRepository = AppDataSource.getRepository(Tontine);
const tontineTypeRepository = AppDataSource.getRepository(TontineType);

export class TontineService {
  /**
   * Creer une nouvelle tontine
   */
  async create(dto: CreateTontineDto): Promise<TontineResponseDto> {
    // Verifier que le type de tontine existe
    const tontineType = await tontineTypeRepository.findOne({
      where: { id: dto.tontineTypeId },
    });
    if (!tontineType) {
      throw new NotFoundError(`Type de tontine non trouve: ${dto.tontineTypeId}`);
    }

    // Verifier l'unicite du nom court
    const existing = await tontineRepository.findOne({
      where: { nomCourt: dto.nomCourt },
    });
    if (existing) {
      throw new BadRequestError(`Le nom court "${dto.nomCourt}" existe deja`);
    }

    const tontine = tontineRepository.create({
      nom: dto.nom,
      nomCourt: dto.nomCourt,
      tontineTypeId: dto.tontineTypeId,
      anneeFondation: dto.anneeFondation || null,
      motto: dto.motto || null,
      logo: dto.logo || null,
      estOfficiellementDeclaree: dto.estOfficiellementDeclaree || false,
      numeroEnregistrement: dto.numeroEnregistrement || null,
      documentStatuts: dto.documentStatuts || null,
      statut: StatutTontine.ACTIVE,
    });

    const saved = await tontineRepository.save(tontine);

    // Recharger avec les relations
    const reloaded = await tontineRepository.findOne({
      where: { id: saved.id },
      relations: ['tontineType', 'adhesions'],
    });

    return this.toResponseDto(reloaded!);
  }

  /**
   * Lister toutes les tontines
   */
  async findAll(filters?: { statut?: StatutTontine }): Promise<TontineListItemDto[]> {
    const queryBuilder = tontineRepository
      .createQueryBuilder('tontine')
      .leftJoinAndSelect('tontine.tontineType', 'tontineType')
      .leftJoin('tontine.adhesions', 'adhesions')
      .leftJoin('tontine.exercices', 'exercices')
      .addSelect('COUNT(DISTINCT adhesions.id)', 'nombreMembres')
      .groupBy('tontine.id')
      .addGroupBy('tontineType.id');

    if (filters?.statut) {
      queryBuilder.where('tontine.statut = :statut', { statut: filters.statut });
    }

    const tontines = await queryBuilder.orderBy('tontine.nom', 'ASC').getRawAndEntities();

    return tontines.entities.map((tontine, index) => this.toListItemDto(
      tontine,
      parseInt(tontines.raw[index].nombreMembres) || 0
    ));
  }

  /**
   * Trouver une tontine par ID
   */
  async findById(id: string): Promise<TontineResponseDto> {
    const tontine = await tontineRepository.findOne({
      where: { id },
      relations: ['tontineType', 'adhesions', 'exercices'],
    });

    if (!tontine) {
      throw new NotFoundError(`Tontine non trouvee: ${id}`);
    }

    return this.toResponseDto(tontine);
  }

  /**
   * Trouver une tontine par nom court
   */
  async findByNomCourt(nomCourt: string): Promise<TontineResponseDto> {
    const tontine = await tontineRepository.findOne({
      where: { nomCourt },
      relations: ['tontineType', 'adhesions', 'exercices'],
    });

    if (!tontine) {
      throw new NotFoundError(`Tontine non trouvee avec le nom court: ${nomCourt}`);
    }

    return this.toResponseDto(tontine);
  }

  /**
   * Mettre a jour une tontine
   */
  async update(id: string, dto: UpdateTontineDto): Promise<TontineResponseDto> {
    const tontine = await tontineRepository.findOne({
      where: { id },
      relations: ['tontineType'],
    });

    if (!tontine) {
      throw new NotFoundError(`Tontine non trouvee: ${id}`);
    }

    // Verifier l'unicite du nouveau nom court si change
    if (dto.nomCourt && dto.nomCourt !== tontine.nomCourt) {
      const existing = await tontineRepository.findOne({
        where: { nomCourt: dto.nomCourt },
      });
      if (existing) {
        throw new BadRequestError(`Le nom court "${dto.nomCourt}" existe deja`);
      }
    }

    if (dto.nom !== undefined) tontine.nom = dto.nom;
    if (dto.nomCourt !== undefined) tontine.nomCourt = dto.nomCourt;
    if (dto.anneeFondation !== undefined) tontine.anneeFondation = dto.anneeFondation;
    if (dto.motto !== undefined) tontine.motto = dto.motto;
    if (dto.logo !== undefined) tontine.logo = dto.logo;
    if (dto.estOfficiellementDeclaree !== undefined) tontine.estOfficiellementDeclaree = dto.estOfficiellementDeclaree;
    if (dto.numeroEnregistrement !== undefined) tontine.numeroEnregistrement = dto.numeroEnregistrement;
    if (dto.documentStatuts !== undefined) tontine.documentStatuts = dto.documentStatuts;
    if (dto.statut !== undefined) tontine.statut = dto.statut;

    const updated = await tontineRepository.save(tontine);

    const reloaded = await tontineRepository.findOne({
      where: { id: updated.id },
      relations: ['tontineType', 'adhesions', 'exercices'],
    });

    return this.toResponseDto(reloaded!);
  }

  /**
   * Suspendre une tontine
   */
  async suspend(id: string): Promise<TontineResponseDto> {
    return this.update(id, { statut: StatutTontine.SUSPENDUE });
  }

  /**
   * Reactiver une tontine
   */
  async activate(id: string): Promise<TontineResponseDto> {
    return this.update(id, { statut: StatutTontine.ACTIVE });
  }

  /**
   * Supprimer une tontine (soft delete)
   */
  async delete(id: string): Promise<void> {
    const tontine = await tontineRepository.findOne({ where: { id } });
    if (!tontine) {
      throw new NotFoundError(`Tontine non trouvee: ${id}`);
    }

    await tontineRepository.softRemove(tontine);
  }

  /**
   * Transformer en DTO de reponse
   */
  private toResponseDto(entity: Tontine): TontineResponseDto {
    const exerciceActif = entity.exercices?.find(
      (e) => e.statut === StatutExercice.OUVERT
    );

    return {
      id: entity.id,
      nom: entity.nom,
      nomCourt: entity.nomCourt,
      anneeFondation: entity.anneeFondation,
      motto: entity.motto,
      logo: entity.logo,
      estOfficiellementDeclaree: entity.estOfficiellementDeclaree,
      numeroEnregistrement: entity.numeroEnregistrement,
      statut: entity.statut,
      tontineType: entity.tontineType ? {
        id: entity.tontineType.id,
        code: entity.tontineType.code,
        libelle: entity.tontineType.libelle,
      } : { id: '', code: '', libelle: '' },
      documentStatuts: entity.documentStatuts,
      creeLe: entity.creeLe,
      modifieLe: entity.modifieLe,
      nombreMembres: entity.adhesions?.length || 0,
      nombreExercices: entity.exercices?.length || 0,
    };
  }

  /**
   * Transformer en DTO de liste
   */
  private toListItemDto(entity: Tontine, nombreMembres: number): TontineListItemDto {
    const exerciceActif = entity.exercices?.find(
      (e) => e.statut === StatutExercice.OUVERT
    );

    return {
      id: entity.id,
      nom: entity.nom,
      nomCourt: entity.nomCourt,
      statut: entity.statut,
      tontineType: entity.tontineType ? {
        id: entity.tontineType.id,
        code: entity.tontineType.code,
        libelle: entity.tontineType.libelle,
      } : { id: '', code: '', libelle: '' },
      nombreMembres,
      exerciceActif: exerciceActif
        ? { id: exerciceActif.id, libelle: exerciceActif.libelle }
        : null,
    };
  }
}

export const tontineService = new TontineService();
