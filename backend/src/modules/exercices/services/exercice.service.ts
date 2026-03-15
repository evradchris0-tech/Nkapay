/**
 * Service pour la gestion des exercices
 */

import { Repository } from 'typeorm';
import { AppDataSource } from '../../../config';
import { NotFoundError, BadRequestError } from '../../../shared';
import { Exercice, StatutExercice } from '../entities/exercice.entity';
import { ExerciceMembre, TypeMembre, StatutExerciceMembre } from '../entities/exercice-membre.entity';
import { Tontine } from '../../tontines/entities/tontine.entity';
import { AdhesionTontine, StatutAdhesion } from '../../tontines/entities/adhesion-tontine.entity';
import {
  CreateExerciceDto,
  UpdateExerciceDto,
  OuvrirExerciceDto,
  ExerciceResponseDto,
  ExerciceListItemDto,
  ExerciceFiltersDto,
} from '../dto/exercice.dto';
import { regleExerciceService } from './regle-exercice.service';

export class ExerciceService {
  private _exerciceRepo?: Repository<Exercice>;
  private _exerciceMembreRepo?: Repository<ExerciceMembre>;
  private _tontineRepo?: Repository<Tontine>;
  private _adhesionRepo?: Repository<AdhesionTontine>;

  private get exerciceRepository(): Repository<Exercice> {
    if (!this._exerciceRepo) this._exerciceRepo = AppDataSource.getRepository(Exercice);
    return this._exerciceRepo;
  }

  private get exerciceMembreRepository(): Repository<ExerciceMembre> {
    if (!this._exerciceMembreRepo) this._exerciceMembreRepo = AppDataSource.getRepository(ExerciceMembre);
    return this._exerciceMembreRepo;
  }

  private get tontineRepository(): Repository<Tontine> {
    if (!this._tontineRepo) this._tontineRepo = AppDataSource.getRepository(Tontine);
    return this._tontineRepo;
  }

  private get adhesionRepository(): Repository<AdhesionTontine> {
    if (!this._adhesionRepo) this._adhesionRepo = AppDataSource.getRepository(AdhesionTontine);
    return this._adhesionRepo;
  }

  /**
   * Creer un nouvel exercice (en mode brouillon)
   */
  async create(dto: CreateExerciceDto): Promise<ExerciceResponseDto> {
    // Verifier que la tontine existe
    const tontine = await this.tontineRepository.findOne({ where: { id: dto.tontineId } });
    if (!tontine) {
      throw new NotFoundError(`Tontine non trouvee: ${dto.tontineId}`);
    }

    // Verifier l'unicite du libelle dans la tontine
    const existing = await this.exerciceRepository.findOne({
      where: { tontineId: dto.tontineId, libelle: dto.libelle },
    });
    if (existing) {
      throw new BadRequestError(`Un exercice avec le libelle "${dto.libelle}" existe deja pour cette tontine`);
    }

    const exercice = this.exerciceRepository.create({
      tontineId: dto.tontineId,
      libelle: dto.libelle,
      anneeDebut: dto.anneeDebut,
      moisDebut: dto.moisDebut,
      anneeFin: dto.anneeFin,
      moisFin: dto.moisFin,
      dureeMois: dto.dureeMois,
      statut: StatutExercice.BROUILLON,
    });

    const saved = await this.exerciceRepository.save(exercice);

    const reloaded = await this.exerciceRepository.findOne({
      where: { id: saved.id },
      relations: ['tontine', 'membres', 'reunions'],
    });

    return this.toResponseDto(reloaded!);
  }

  /**
   * Ouvrir un exercice (passer de BROUILLON a OUVERT)
   */
  async ouvrir(id: string, dto?: OuvrirExerciceDto): Promise<ExerciceResponseDto> {
    const exercice = await this.exerciceRepository.findOne({
      where: { id },
      relations: ['tontine'],
    });

    if (!exercice) {
      throw new NotFoundError(`Exercice non trouve: ${id}`);
    }

    if (exercice.statut !== StatutExercice.BROUILLON) {
      throw new BadRequestError('Seul un exercice en brouillon peut etre ouvert');
    }

    // Verifier qu'il n'y a pas deja un exercice ouvert pour cette tontine
    const exerciceOuvert = await this.exerciceRepository.findOne({
      where: { tontineId: exercice.tontineId, statut: StatutExercice.OUVERT },
    });
    if (exerciceOuvert) {
      throw new BadRequestError(`Un exercice est deja ouvert: ${exerciceOuvert.libelle}`);
    }

    // Ouvrir l'exercice
    exercice.statut = StatutExercice.OUVERT;
    exercice.ouvertLe = new Date();

    await this.exerciceRepository.save(exercice);

    // Ajouter automatiquement les membres actifs de la tontine
    const adhesions = await this.adhesionRepository.find({
      where: { tontineId: exercice.tontineId, statut: StatutAdhesion.ACTIVE },
    });

    const adhesionIds = dto?.adhesionIds || adhesions.map((a) => a.id);
    const adhesionsToAdd = adhesions.filter((a) => adhesionIds.includes(a.id));

    const exerciceMembres = adhesionsToAdd.map((adhesion) =>
      this.exerciceMembreRepository.create({
        exerciceId: exercice.id,
        adhesionTontineId: adhesion.id,
        typeMembre: TypeMembre.ANCIEN, // A ajuster selon la logique metier
        moisEntree: 1,
        dateEntreeExercice: new Date(),
        nombreParts: 1,
        statut: StatutExerciceMembre.ACTIF,
      })
    );

    if (exerciceMembres.length > 0) {
      await this.exerciceMembreRepository.save(exerciceMembres);
    }

    // Initialiser automatiquement les règles depuis la tontine
    try {
      await regleExerciceService.initializeFromTontine(exercice.id, exercice.tontineId);
    } catch {
      // Ne pas bloquer l'ouverture si l'initialisation des règles échoue
    }

    const reloaded = await this.exerciceRepository.findOne({
      where: { id: exercice.id },
      relations: ['tontine', 'membres', 'reunions'],
    });

    return this.toResponseDto(reloaded!);
  }

  /**
   * Suspendre un exercice
   */
  async suspendre(id: string): Promise<ExerciceResponseDto> {
    const exercice = await this.exerciceRepository.findOne({
      where: { id },
      relations: ['tontine', 'membres', 'reunions'],
    });

    if (!exercice) {
      throw new NotFoundError(`Exercice non trouve: ${id}`);
    }

    if (exercice.statut !== StatutExercice.OUVERT) {
      throw new BadRequestError('Seul un exercice ouvert peut etre suspendu');
    }

    exercice.statut = StatutExercice.SUSPENDU;
    await this.exerciceRepository.save(exercice);

    return this.toResponseDto(exercice);
  }

  /**
   * Reprendre un exercice suspendu
   */
  async reprendre(id: string): Promise<ExerciceResponseDto> {
    const exercice = await this.exerciceRepository.findOne({
      where: { id },
      relations: ['tontine', 'membres', 'reunions'],
    });

    if (!exercice) {
      throw new NotFoundError(`Exercice non trouve: ${id}`);
    }

    if (exercice.statut !== StatutExercice.SUSPENDU) {
      throw new BadRequestError('Seul un exercice suspendu peut etre repris');
    }

    exercice.statut = StatutExercice.OUVERT;
    await this.exerciceRepository.save(exercice);

    return this.toResponseDto(exercice);
  }

  /**
   * Fermer un exercice
   */
  async fermer(id: string): Promise<ExerciceResponseDto> {
    const exercice = await this.exerciceRepository.findOne({
      where: { id },
      relations: ['tontine', 'membres', 'reunions'],
    });

    if (!exercice) {
      throw new NotFoundError(`Exercice non trouve: ${id}`);
    }

    if (exercice.statut !== StatutExercice.OUVERT) {
      throw new BadRequestError('Seul un exercice ouvert peut etre ferme');
    }

    exercice.statut = StatutExercice.FERME;
    exercice.fermeLe = new Date();
    await this.exerciceRepository.save(exercice);

    return this.toResponseDto(exercice);
  }

  /**
   * Lister les exercices
   */
  async findAll(filters?: ExerciceFiltersDto): Promise<ExerciceListItemDto[]> {
    const queryBuilder = this.exerciceRepository
      .createQueryBuilder('exercice')
      .leftJoin('exercice.membres', 'membres')
      .addSelect('COUNT(membres.id)', 'nombreMembres')
      .groupBy('exercice.id');

    if (filters?.tontineId) {
      queryBuilder.where('exercice.tontineId = :tontineId', { tontineId: filters.tontineId });
    }
    if (filters?.statut) {
      queryBuilder.andWhere('exercice.statut = :statut', { statut: filters.statut });
    }
    if (filters?.annee) {
      queryBuilder.andWhere('exercice.anneeDebut = :annee', { annee: filters.annee });
    }

    const result = await queryBuilder.orderBy('exercice.anneeDebut', 'DESC').getRawAndEntities();

    return result.entities.map((exercice: Exercice, index: number) => ({
      id: exercice.id,
      libelle: exercice.libelle,
      anneeDebut: exercice.anneeDebut,
      moisDebut: exercice.moisDebut,
      anneeFin: exercice.anneeFin,
      moisFin: exercice.moisFin,
      statut: exercice.statut,
      nombreMembres: parseInt(result.raw[index].nombreMembres) || 0,
    }));
  }

  /**
   * Trouver un exercice par ID
   */
  async findById(id: string): Promise<ExerciceResponseDto> {
    const exercice = await this.exerciceRepository.findOne({
      where: { id },
      relations: ['tontine', 'membres', 'reunions'],
    });

    if (!exercice) {
      throw new NotFoundError(`Exercice non trouve: ${id}`);
    }

    return this.toResponseDto(exercice);
  }

  /**
   * Trouver l'exercice ouvert d'une tontine
   */
  async findExerciceOuvert(tontineId: string): Promise<ExerciceResponseDto | null> {
    const exercice = await this.exerciceRepository.findOne({
      where: { tontineId, statut: StatutExercice.OUVERT },
      relations: ['tontine', 'membres', 'reunions'],
    });

    return exercice ? this.toResponseDto(exercice) : null;
  }

  /**
   * Mettre a jour un exercice
   */
  async update(id: string, dto: UpdateExerciceDto): Promise<ExerciceResponseDto> {
    const exercice = await this.exerciceRepository.findOne({
      where: { id },
      relations: ['tontine', 'membres', 'reunions'],
    });

    if (!exercice) {
      throw new NotFoundError(`Exercice non trouve: ${id}`);
    }

    if (exercice.statut !== StatutExercice.BROUILLON) {
      throw new BadRequestError('Seul un exercice en brouillon peut etre modifie');
    }

    if (dto.libelle !== undefined) exercice.libelle = dto.libelle;
    if (dto.anneeDebut !== undefined) exercice.anneeDebut = dto.anneeDebut;
    if (dto.moisDebut !== undefined) exercice.moisDebut = dto.moisDebut;
    if (dto.anneeFin !== undefined) exercice.anneeFin = dto.anneeFin;
    if (dto.moisFin !== undefined) exercice.moisFin = dto.moisFin;
    if (dto.dureeMois !== undefined) exercice.dureeMois = dto.dureeMois;

    await this.exerciceRepository.save(exercice);

    return this.toResponseDto(exercice);
  }

  /**
   * Supprimer un exercice (seulement en brouillon)
   */
  async delete(id: string): Promise<void> {
    const exercice = await this.exerciceRepository.findOne({ where: { id } });
    if (!exercice) {
      throw new NotFoundError(`Exercice non trouve: ${id}`);
    }

    if (exercice.statut !== StatutExercice.BROUILLON) {
      throw new BadRequestError('Seul un exercice en brouillon peut etre supprime');
    }

    await this.exerciceRepository.remove(exercice);
  }

  /**
   * Transformer en DTO de reponse
   */
  private toResponseDto(entity: Exercice): ExerciceResponseDto {
    return {
      id: entity.id,
      tontine: entity.tontine ? {
        id: entity.tontine.id,
        nom: entity.tontine.nom,
        nomCourt: entity.tontine.nomCourt,
      } : { id: '', nom: '', nomCourt: '' },
      libelle: entity.libelle,
      anneeDebut: entity.anneeDebut,
      moisDebut: entity.moisDebut,
      anneeFin: entity.anneeFin,
      moisFin: entity.moisFin,
      dureeMois: entity.dureeMois,
      statut: entity.statut,
      ouvertLe: entity.ouvertLe,
      fermeLe: entity.fermeLe,
      nombreMembres: entity.membres?.length || 0,
      nombreReunions: entity.reunions?.length || 0,
      creeLe: entity.creeLe,
      modifieLe: entity.modifieLe,
    };
  }
}

export const exerciceService = new ExerciceService();
