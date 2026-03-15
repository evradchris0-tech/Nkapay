/**
 * Service pour la gestion des membres d'exercice
 */

import { Repository } from 'typeorm';
import { AppDataSource } from '../../../config';
import { NotFoundError, BadRequestError } from '../../../shared';
import { ExerciceMembre, TypeMembre, StatutExerciceMembre } from '../entities/exercice-membre.entity';
import { Exercice, StatutExercice } from '../entities/exercice.entity';
import { AdhesionTontine } from '../../tontines/entities/adhesion-tontine.entity';
import {
  CreateExerciceMembreDto,
  UpdateExerciceMembreDto,
  ExerciceMembreResponseDto,
  ExerciceMembreListItemDto,
  ExerciceMembreFiltersDto,
} from '../dto/exercice-membre.dto';

export class ExerciceMembreService {
  private _exerciceMembreRepo?: Repository<ExerciceMembre>;
  private _exerciceRepo?: Repository<Exercice>;
  private _adhesionRepo?: Repository<AdhesionTontine>;

  private get exerciceMembreRepository(): Repository<ExerciceMembre> {
    if (!this._exerciceMembreRepo) this._exerciceMembreRepo = AppDataSource.getRepository(ExerciceMembre);
    return this._exerciceMembreRepo;
  }

  private get exerciceRepository(): Repository<Exercice> {
    if (!this._exerciceRepo) this._exerciceRepo = AppDataSource.getRepository(Exercice);
    return this._exerciceRepo;
  }

  private get adhesionRepository(): Repository<AdhesionTontine> {
    if (!this._adhesionRepo) this._adhesionRepo = AppDataSource.getRepository(AdhesionTontine);
    return this._adhesionRepo;
  }

  /**
   * Ajouter un membre a un exercice
   */
  async create(dto: CreateExerciceMembreDto): Promise<ExerciceMembreResponseDto> {
    // Verifier que l'exercice existe et est ouvert
    const exercice = await this.exerciceRepository.findOne({ where: { id: dto.exerciceId } });
    if (!exercice) {
      throw new NotFoundError(`Exercice non trouve: ${dto.exerciceId}`);
    }
    if (exercice.statut !== StatutExercice.OUVERT) {
      throw new BadRequestError('On ne peut ajouter un membre que dans un exercice ouvert');
    }

    // Verifier que l'adhesion existe
    const adhesion = await this.adhesionRepository.findOne({
      where: { id: dto.adhesionTontineId },
      relations: ['utilisateur'],
    });
    if (!adhesion) {
      throw new NotFoundError(`Adhesion non trouvee: ${dto.adhesionTontineId}`);
    }

    // Verifier que l'adhesion est pour la meme tontine
    if (adhesion.tontineId !== exercice.tontineId) {
      throw new BadRequestError('L\'adhesion n\'appartient pas a la meme tontine que l\'exercice');
    }

    // Verifier que le membre n'est pas deja dans l'exercice
    const existing = await this.exerciceMembreRepository.findOne({
      where: { exerciceId: dto.exerciceId, adhesionTontineId: dto.adhesionTontineId },
    });
    if (existing) {
      throw new BadRequestError('Ce membre est deja inscrit a cet exercice');
    }

    const exerciceMembre = this.exerciceMembreRepository.create({
      exerciceId: dto.exerciceId,
      adhesionTontineId: dto.adhesionTontineId,
      typeMembre: dto.typeMembre,
      moisEntree: dto.moisEntree || 1,
      dateEntreeExercice: dto.dateEntreeExercice,
      nombreParts: dto.nombreParts || 1,
      statut: StatutExerciceMembre.ACTIF,
      parrainExerciceMembreId: dto.parrainExerciceMembreId || null,
    });

    const saved = await this.exerciceMembreRepository.save(exerciceMembre);

    const reloaded = await this.exerciceMembreRepository.findOne({
      where: { id: saved.id },
      relations: ['exercice', 'adhesionTontine', 'adhesionTontine.utilisateur', 'parrain', 'parrain.adhesionTontine'],
    });

    return this.toResponseDto(reloaded!);
  }

  /**
   * Lister les membres avec filtres query params
   */
  async findAll(filters?: ExerciceMembreFiltersDto): Promise<{ membres: ExerciceMembreListItemDto[]; total: number }> {
    const queryBuilder = this.exerciceMembreRepository
      .createQueryBuilder('em')
      .leftJoinAndSelect('em.adhesionTontine', 'adhesion')
      .leftJoinAndSelect('adhesion.utilisateur', 'utilisateur');

    if (filters?.exerciceId) {
      queryBuilder.andWhere('em.exerciceId = :exerciceId', { exerciceId: filters.exerciceId });
    }
    if (filters?.adhesionTontineId) {
      queryBuilder.andWhere('em.adhesionTontineId = :adhesionTontineId', { adhesionTontineId: filters.adhesionTontineId });
    }
    if (filters?.typeMembre) {
      queryBuilder.andWhere('em.typeMembre = :typeMembre', { typeMembre: filters.typeMembre });
    }
    if (filters?.statut) {
      queryBuilder.andWhere('em.statut = :statut', { statut: filters.statut });
    } else if (filters?.estActif !== undefined) {
      const statut = (filters.estActif === true || filters.estActif === 'true')
        ? StatutExerciceMembre.ACTIF
        : StatutExerciceMembre.INACTIF;
      queryBuilder.andWhere('em.statut = :statut', { statut });
    }

    const membres = await queryBuilder.orderBy('adhesion.matricule', 'ASC').getMany();
    return { membres: membres.map((m) => this.toListItemDto(m)), total: membres.length };
  }

  /**
   * Lister les membres d'un exercice
   */
  async findByExercice(exerciceId: string, filters?: ExerciceMembreFiltersDto): Promise<ExerciceMembreListItemDto[]> {
    const queryBuilder = this.exerciceMembreRepository
      .createQueryBuilder('em')
      .leftJoinAndSelect('em.adhesionTontine', 'adhesion')
      .leftJoinAndSelect('adhesion.utilisateur', 'utilisateur')
      .where('em.exerciceId = :exerciceId', { exerciceId });

    if (filters?.typeMembre) {
      queryBuilder.andWhere('em.typeMembre = :typeMembre', { typeMembre: filters.typeMembre });
    }
    if (filters?.statut) {
      queryBuilder.andWhere('em.statut = :statut', { statut: filters.statut });
    }

    const membres = await queryBuilder
      .orderBy('adhesion.matricule', 'ASC')
      .getMany();

    return membres.map((m) => this.toListItemDto(m));
  }

  /**
   * Trouver un membre d'exercice par ID
   */
  async findById(id: string): Promise<ExerciceMembreResponseDto> {
    const membre = await this.exerciceMembreRepository.findOne({
      where: { id },
      relations: ['exercice', 'adhesionTontine', 'adhesionTontine.utilisateur', 'parrain', 'parrain.adhesionTontine'],
    });

    if (!membre) {
      throw new NotFoundError(`Membre d'exercice non trouve: ${id}`);
    }

    return this.toResponseDto(membre);
  }

  /**
   * Mettre a jour un membre d'exercice
   */
  async update(id: string, dto: UpdateExerciceMembreDto): Promise<ExerciceMembreResponseDto> {
    const membre = await this.exerciceMembreRepository.findOne({
      where: { id },
      relations: ['exercice', 'adhesionTontine', 'adhesionTontine.utilisateur', 'parrain', 'parrain.adhesionTontine'],
    });

    if (!membre) {
      throw new NotFoundError(`Membre d'exercice non trouve: ${id}`);
    }

    if (dto.typeMembre !== undefined) membre.typeMembre = dto.typeMembre;
    if (dto.moisEntree !== undefined) membre.moisEntree = dto.moisEntree;
    if (dto.nombreParts !== undefined) membre.nombreParts = dto.nombreParts;
    if (dto.statut !== undefined) membre.statut = dto.statut;
    if (dto.parrainExerciceMembreId !== undefined) membre.parrainExerciceMembreId = dto.parrainExerciceMembreId;

    await this.exerciceMembreRepository.save(membre);

    const reloaded = await this.exerciceMembreRepository.findOne({
      where: { id: membre.id },
      relations: ['exercice', 'adhesionTontine', 'adhesionTontine.utilisateur', 'parrain', 'parrain.adhesionTontine'],
    });

    return this.toResponseDto(reloaded!);
  }

  /**
   * Desactiver un membre d'exercice
   */
  async deactivate(id: string): Promise<ExerciceMembreResponseDto> {
    return this.update(id, { statut: StatutExerciceMembre.INACTIF });
  }

  /**
   * Reactiver un membre d'exercice
   */
  async reactivate(id: string): Promise<ExerciceMembreResponseDto> {
    return this.update(id, { statut: StatutExerciceMembre.ACTIF });
  }

  /**
   * Supprimer un membre d'exercice (soft delete)
   */
  async delete(id: string): Promise<void> {
    const membre = await this.exerciceMembreRepository.findOne({ where: { id } });
    if (!membre) {
      throw new NotFoundError(`Membre d'exercice non trouve: ${id}`);
    }

    await this.exerciceMembreRepository.softRemove(membre);
  }

  /**
   * Transformer en DTO de reponse
   */
  private toResponseDto(entity: ExerciceMembre): ExerciceMembreResponseDto {
    return {
      id: entity.id,
      exercice: entity.exercice ? {
        id: entity.exercice.id,
        libelle: entity.exercice.libelle,
      } : { id: '', libelle: '' },
      adhesionTontine: entity.adhesionTontine ? {
        id: entity.adhesionTontine.id,
        matricule: entity.adhesionTontine.matricule,
        utilisateur: entity.adhesionTontine.utilisateur ? {
          id: entity.adhesionTontine.utilisateur.id,
          nom: entity.adhesionTontine.utilisateur.nom,
          prenom: entity.adhesionTontine.utilisateur.prenom,
        } : { id: '', nom: '', prenom: '' },
      } : { id: '', matricule: '', utilisateur: { id: '', nom: '', prenom: '' } },
      typeMembre: entity.typeMembre,
      moisEntree: entity.moisEntree,
      dateEntreeExercice: entity.dateEntreeExercice,
      nombreParts: Number(entity.nombreParts),
      statut: entity.statut,
      parrain: entity.parrain && entity.parrain.adhesionTontine ? {
        id: entity.parrain.id,
        matricule: entity.parrain.adhesionTontine.matricule,
      } : null,
      creeLe: entity.creeLe,
      modifieLe: entity.modifieLe,
    };
  }

  /**
   * Transformer en DTO de liste
   */
  private toListItemDto(entity: ExerciceMembre): ExerciceMembreListItemDto {
    const utilisateur = entity.adhesionTontine?.utilisateur;
    return {
      id: entity.id,
      matricule: entity.adhesionTontine?.matricule || '',
      nomComplet: utilisateur ? `${utilisateur.prenom} ${utilisateur.nom}` : '',
      typeMembre: entity.typeMembre,
      nombreParts: Number(entity.nombreParts),
      statut: entity.statut,
    };
  }
}

export const exerciceMembreService = new ExerciceMembreService();
