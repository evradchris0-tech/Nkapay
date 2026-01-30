/**
 * Service pour la gestion des reunions
 */

import { AppDataSource } from '../../../config';
import { NotFoundError, BadRequestError } from '../../../shared';
import { Reunion, StatutReunion } from '../entities/reunion.entity';
import { Exercice, StatutExercice } from '../../exercices/entities/exercice.entity';
import { ExerciceMembre, StatutExerciceMembre } from '../../exercices/entities/exercice-membre.entity';
import { PresenceReunion } from '../entities/presence-reunion.entity';
import {
  PlanifierReunionDto,
  UpdateReunionDto,
  OuvrirReunionDto,
  CloturerReunionDto,
  ReunionResponseDto,
  ReunionFiltersDto,
} from '../dto/reunion.dto';

const reunionRepository = AppDataSource.getRepository(Reunion);
const exerciceRepository = AppDataSource.getRepository(Exercice);
const exerciceMembreRepository = AppDataSource.getRepository(ExerciceMembre);
const presenceRepository = AppDataSource.getRepository(PresenceReunion);

export class ReunionService {
  /**
   * Planifier une nouvelle reunion
   */
  async planifier(dto: PlanifierReunionDto): Promise<ReunionResponseDto> {
    // Verifier que l'exercice existe et est ouvert
    const exercice = await exerciceRepository.findOne({ where: { id: dto.exerciceId } });
    if (!exercice) {
      throw new NotFoundError(`Exercice non trouve: ${dto.exerciceId}`);
    }
    if (exercice.statut !== StatutExercice.OUVERT) {
      throw new BadRequestError('On ne peut planifier une reunion que pour un exercice ouvert');
    }

    // Verifier l'unicite du numero de reunion
    const existing = await reunionRepository.findOne({
      where: { exerciceId: dto.exerciceId, numeroReunion: dto.numeroReunion },
    });
    if (existing) {
      throw new BadRequestError(`Une reunion #${dto.numeroReunion} existe deja pour cet exercice`);
    }

    // Verifier l'hote si fourni
    if (dto.hoteExerciceMembreId) {
      const hote = await exerciceMembreRepository.findOne({ where: { id: dto.hoteExerciceMembreId } });
      if (!hote || hote.exerciceId !== dto.exerciceId) {
        throw new BadRequestError('L\'hote n\'est pas un membre de cet exercice');
      }
    }

    const reunion = reunionRepository.create({
      exerciceId: dto.exerciceId,
      numeroReunion: dto.numeroReunion,
      dateReunion: new Date(dto.dateReunion),
      heureDebut: dto.heureDebut || null,
      lieu: dto.lieu || null,
      hoteExerciceMembreId: dto.hoteExerciceMembreId || null,
      statut: StatutReunion.PLANIFIEE,
    });

    const saved = await reunionRepository.save(reunion);

    return this.findById(saved.id);
  }

  /**
   * Ouvrir une reunion
   */
  async ouvrir(id: string, dto?: OuvrirReunionDto): Promise<ReunionResponseDto> {
    const reunion = await reunionRepository.findOne({
      where: { id },
      relations: ['exercice'],
    });

    if (!reunion) {
      throw new NotFoundError(`Reunion non trouvee: ${id}`);
    }

    if (reunion.statut !== StatutReunion.PLANIFIEE) {
      throw new BadRequestError('Seule une reunion planifiee peut etre ouverte');
    }

    reunion.statut = StatutReunion.OUVERTE;
    reunion.ouverteLe = new Date();
    if (dto?.heureDebut) {
      reunion.heureDebut = dto.heureDebut;
    }

    await reunionRepository.save(reunion);

    // Creer les enregistrements de presence pour tous les membres actifs
    const membres = await exerciceMembreRepository.find({
      where: { exerciceId: reunion.exerciceId, statut: StatutExerciceMembre.ACTIF },
    });

    const presences = membres.map((membre) =>
      presenceRepository.create({
        reunionId: reunion.id,
        exerciceMembreId: membre.id,
        estPresent: false,
        estEnRetard: false,
      })
    );

    if (presences.length > 0) {
      await presenceRepository.save(presences);
    }

    return this.findById(id);
  }

  /**
   * Cloturer une reunion
   */
  async cloturer(id: string, dto: CloturerReunionDto): Promise<ReunionResponseDto> {
    const reunion = await reunionRepository.findOne({ where: { id } });

    if (!reunion) {
      throw new NotFoundError(`Reunion non trouvee: ${id}`);
    }

    if (reunion.statut !== StatutReunion.OUVERTE) {
      throw new BadRequestError('Seule une reunion ouverte peut etre cloturee');
    }

    reunion.statut = StatutReunion.CLOTUREE;
    reunion.clotureeLe = new Date();
    reunion.clotureeParExerciceMembreId = dto.clotureeParExerciceMembreId;

    await reunionRepository.save(reunion);

    return this.findById(id);
  }

  /**
   * Annuler une reunion
   */
  async annuler(id: string): Promise<ReunionResponseDto> {
    const reunion = await reunionRepository.findOne({ where: { id } });

    if (!reunion) {
      throw new NotFoundError(`Reunion non trouvee: ${id}`);
    }

    if (reunion.statut === StatutReunion.CLOTUREE) {
      throw new BadRequestError('Une reunion cloturee ne peut pas etre annulee');
    }

    reunion.statut = StatutReunion.ANNULEE;
    await reunionRepository.save(reunion);

    return this.findById(id);
  }

  /**
   * Lister les reunions
   */
  async findAll(filters?: ReunionFiltersDto): Promise<ReunionResponseDto[]> {
    const queryBuilder = reunionRepository
      .createQueryBuilder('reunion')
      .leftJoinAndSelect('reunion.hote', 'hote')
      .leftJoinAndSelect('hote.adhesionTontine', 'adhesionHote')
      .leftJoinAndSelect('adhesionHote.utilisateur', 'utilisateurHote')
      .leftJoin('reunion.presences', 'presences');

    if (filters?.exerciceId) {
      queryBuilder.where('reunion.exerciceId = :exerciceId', { exerciceId: filters.exerciceId });
    }
    if (filters?.statut) {
      queryBuilder.andWhere('reunion.statut = :statut', { statut: filters.statut });
    }
    if (filters?.dateDebut) {
      queryBuilder.andWhere('reunion.dateReunion >= :dateDebut', { dateDebut: filters.dateDebut });
    }
    if (filters?.dateFin) {
      queryBuilder.andWhere('reunion.dateReunion <= :dateFin', { dateFin: filters.dateFin });
    }

    const reunions = await queryBuilder
      .orderBy('reunion.numeroReunion', 'ASC')
      .getMany();

    return Promise.all(reunions.map((r) => this.toResponseDto(r)));
  }

  /**
   * Trouver une reunion par ID
   */
  async findById(id: string): Promise<ReunionResponseDto> {
    const reunion = await reunionRepository.findOne({
      where: { id },
      relations: ['hote', 'hote.adhesionTontine', 'hote.adhesionTontine.utilisateur', 'presences'],
    });

    if (!reunion) {
      throw new NotFoundError(`Reunion non trouvee: ${id}`);
    }

    return this.toResponseDto(reunion);
  }

  /**
   * Mettre a jour une reunion
   */
  async update(id: string, dto: UpdateReunionDto): Promise<ReunionResponseDto> {
    const reunion = await reunionRepository.findOne({ where: { id } });

    if (!reunion) {
      throw new NotFoundError(`Reunion non trouvee: ${id}`);
    }

    if (reunion.statut === StatutReunion.CLOTUREE) {
      throw new BadRequestError('Une reunion cloturee ne peut pas etre modifiee');
    }

    if (dto.dateReunion !== undefined) reunion.dateReunion = new Date(dto.dateReunion);
    if (dto.heureDebut !== undefined) reunion.heureDebut = dto.heureDebut;
    if (dto.lieu !== undefined) reunion.lieu = dto.lieu;
    if (dto.hoteExerciceMembreId !== undefined) reunion.hoteExerciceMembreId = dto.hoteExerciceMembreId;

    await reunionRepository.save(reunion);

    return this.findById(id);
  }

  /**
   * Supprimer une reunion
   */
  async delete(id: string): Promise<void> {
    const reunion = await reunionRepository.findOne({ where: { id } });

    if (!reunion) {
      throw new NotFoundError(`Reunion non trouvee: ${id}`);
    }

    if (reunion.statut !== StatutReunion.PLANIFIEE && reunion.statut !== StatutReunion.ANNULEE) {
      throw new BadRequestError('Seule une reunion planifiee ou annulee peut etre supprimee');
    }

    await reunionRepository.remove(reunion);
  }

  /**
   * Transformer en DTO de reponse
   */
  private async toResponseDto(entity: Reunion): Promise<ReunionResponseDto> {
    let nombrePresents = 0;
    let nombreAbsents = 0;

    if (entity.presences) {
      nombrePresents = entity.presences.filter((p) => p.estPresent).length;
      nombreAbsents = entity.presences.filter((p) => !p.estPresent).length;
    } else {
      const presences = await presenceRepository.find({ where: { reunionId: entity.id } });
      nombrePresents = presences.filter((p) => p.estPresent).length;
      nombreAbsents = presences.filter((p) => !p.estPresent).length;
    }

    return {
      id: entity.id,
      exerciceId: entity.exerciceId,
      numeroReunion: entity.numeroReunion,
      dateReunion: entity.dateReunion instanceof Date ? entity.dateReunion.toISOString().split('T')[0] : String(entity.dateReunion),
      heureDebut: entity.heureDebut,
      lieu: entity.lieu,
      hoteExerciceMembreId: entity.hoteExerciceMembreId,
      hote: entity.hote && entity.hote.adhesionTontine?.utilisateur ? {
        id: entity.hote.id,
        utilisateurId: entity.hote.adhesionTontine.utilisateur.id,
        utilisateurNom: `${entity.hote.adhesionTontine.utilisateur.prenom} ${entity.hote.adhesionTontine.utilisateur.nom}`,
      } : null,
      statut: entity.statut,
      ouverteLe: entity.ouverteLe,
      clotureeLe: entity.clotureeLe,
      clotureeParExerciceMembreId: entity.clotureeParExerciceMembreId,
      creeLe: entity.creeLe,
      modifieLe: entity.modifieLe,
      nombrePresents,
      nombreAbsents,
    };
  }
}

export const reunionService = new ReunionService();
