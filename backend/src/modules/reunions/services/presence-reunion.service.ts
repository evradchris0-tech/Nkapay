/**
 * Service pour la gestion des presences aux reunions
 */

import { AppDataSource } from '../../../config';
import { NotFoundError, BadRequestError } from '../../../shared';
import { PresenceReunion } from '../entities/presence-reunion.entity';
import { Reunion, StatutReunion } from '../entities/reunion.entity';
import {
  CreatePresenceReunionDto,
  CreatePresencesBulkDto,
  UpdatePresenceReunionDto,
  PresenceReunionResponseDto,
  PresenceReunionSummaryDto,
} from '../dto/presence-reunion.dto';

const presenceRepository = AppDataSource.getRepository(PresenceReunion);
const reunionRepository = AppDataSource.getRepository(Reunion);

export class PresenceReunionService {
  /**
   * Enregistrer une presence
   */
  async create(dto: CreatePresenceReunionDto): Promise<PresenceReunionResponseDto> {
    // Verifier que la reunion existe et est ouverte
    const reunion = await reunionRepository.findOne({ where: { id: dto.reunionId } });
    if (!reunion) {
      throw new NotFoundError(`Reunion non trouvee: ${dto.reunionId}`);
    }
    if (reunion.statut !== StatutReunion.OUVERTE) {
      throw new BadRequestError('On ne peut enregistrer une presence que pour une reunion ouverte');
    }

    // Verifier si la presence existe deja
    let presence = await presenceRepository.findOne({
      where: { reunionId: dto.reunionId, exerciceMembreId: dto.exerciceMembreId },
      relations: ['exerciceMembre', 'exerciceMembre.adhesionTontine', 'exerciceMembre.adhesionTontine.utilisateur'],
    });

    if (presence) {
      // Mettre a jour
      presence.estPresent = dto.estPresent;
      presence.estEnRetard = dto.estEnRetard || false;
      presence.heureArrivee = dto.heureArrivee || null;
      presence.note = dto.note || null;
    } else {
      // Creer
      presence = presenceRepository.create({
        reunionId: dto.reunionId,
        exerciceMembreId: dto.exerciceMembreId,
        estPresent: dto.estPresent,
        estEnRetard: dto.estEnRetard || false,
        heureArrivee: dto.heureArrivee || null,
        note: dto.note || null,
      });
    }

    const saved = await presenceRepository.save(presence);
    return this.findById(saved.id);
  }

  /**
   * Enregistrer plusieurs presences en une fois
   */
  async createBulk(dto: CreatePresencesBulkDto): Promise<PresenceReunionSummaryDto> {
    // Verifier que la reunion existe et est ouverte
    const reunion = await reunionRepository.findOne({ where: { id: dto.reunionId } });
    if (!reunion) {
      throw new NotFoundError(`Reunion non trouvee: ${dto.reunionId}`);
    }
    if (reunion.statut !== StatutReunion.OUVERTE) {
      throw new BadRequestError('On ne peut enregistrer les presences que pour une reunion ouverte');
    }

    for (const item of dto.presences) {
      let presence = await presenceRepository.findOne({
        where: { reunionId: dto.reunionId, exerciceMembreId: item.exerciceMembreId },
      });

      if (presence) {
        presence.estPresent = item.estPresent;
        presence.estEnRetard = item.estEnRetard || false;
        presence.heureArrivee = item.heureArrivee || null;
        presence.note = item.note || null;
        await presenceRepository.save(presence);
      } else {
        presence = presenceRepository.create({
          reunionId: dto.reunionId,
          exerciceMembreId: item.exerciceMembreId,
          estPresent: item.estPresent,
          estEnRetard: item.estEnRetard || false,
          heureArrivee: item.heureArrivee || null,
          note: item.note || null,
        });
        await presenceRepository.save(presence);
      }
    }

    return this.getSummary(dto.reunionId);
  }

  /**
   * Obtenir les presences d'une reunion
   */
  async findByReunion(reunionId: string): Promise<PresenceReunionResponseDto[]> {
    const presences = await presenceRepository.find({
      where: { reunionId },
      relations: ['exerciceMembre', 'exerciceMembre.adhesionTontine', 'exerciceMembre.adhesionTontine.utilisateur'],
      order: { creeLe: 'ASC' },
    });

    return presences.map((p) => this.toResponseDto(p));
  }

  /**
   * Obtenir une presence par ID
   */
  async findById(id: string): Promise<PresenceReunionResponseDto> {
    const presence = await presenceRepository.findOne({
      where: { id },
      relations: ['exerciceMembre', 'exerciceMembre.adhesionTontine', 'exerciceMembre.adhesionTontine.utilisateur'],
    });

    if (!presence) {
      throw new NotFoundError(`Presence non trouvee: ${id}`);
    }

    return this.toResponseDto(presence);
  }

  /**
   * Mettre a jour une presence
   */
  async update(id: string, dto: UpdatePresenceReunionDto): Promise<PresenceReunionResponseDto> {
    const presence = await presenceRepository.findOne({
      where: { id },
      relations: ['reunion'],
    });

    if (!presence) {
      throw new NotFoundError(`Presence non trouvee: ${id}`);
    }

    if (presence.reunion && presence.reunion.statut === StatutReunion.CLOTUREE) {
      throw new BadRequestError('Les presences d\'une reunion cloturee ne peuvent pas etre modifiees');
    }

    if (dto.estPresent !== undefined) presence.estPresent = dto.estPresent;
    if (dto.estEnRetard !== undefined) presence.estEnRetard = dto.estEnRetard;
    if (dto.heureArrivee !== undefined) presence.heureArrivee = dto.heureArrivee;
    if (dto.note !== undefined) presence.note = dto.note;

    await presenceRepository.save(presence);

    return this.findById(id);
  }

  /**
   * Supprimer une presence
   */
  async delete(id: string): Promise<void> {
    const presence = await presenceRepository.findOne({
      where: { id },
      relations: ['reunion'],
    });

    if (!presence) {
      throw new NotFoundError(`Presence non trouvee: ${id}`);
    }

    if (presence.reunion && presence.reunion.statut === StatutReunion.CLOTUREE) {
      throw new BadRequestError('Les presences d\'une reunion cloturee ne peuvent pas etre supprimees');
    }

    await presenceRepository.remove(presence);
  }

  /**
   * Obtenir le resume des presences d'une reunion
   */
  async getSummary(reunionId: string): Promise<PresenceReunionSummaryDto> {
    const presences = await presenceRepository.find({ where: { reunionId } });

    const totalMembres = presences.length;
    const presents = presences.filter((p) => p.estPresent).length;
    const absents = presences.filter((p) => !p.estPresent).length;
    const enRetard = presences.filter((p) => p.estEnRetard).length;
    const tauxPresence = totalMembres > 0 ? Math.round((presents / totalMembres) * 100) : 0;

    return {
      reunionId,
      totalMembres,
      presents,
      absents,
      enRetard,
      tauxPresence,
    };
  }

  /**
   * Transformer en DTO de reponse
   */
  private toResponseDto(entity: PresenceReunion): PresenceReunionResponseDto {
    const utilisateur = entity.exerciceMembre?.adhesionTontine?.utilisateur;
    
    return {
      id: entity.id,
      reunionId: entity.reunionId,
      exerciceMembreId: entity.exerciceMembreId,
      exerciceMembre: entity.exerciceMembre ? {
        id: entity.exerciceMembre.id,
        utilisateurId: utilisateur?.id || '',
        utilisateurNom: utilisateur ? `${utilisateur.prenom} ${utilisateur.nom}` : undefined,
      } : undefined,
      estPresent: entity.estPresent,
      estEnRetard: entity.estEnRetard,
      heureArrivee: entity.heureArrivee,
      note: entity.note,
      creeLe: entity.creeLe,
      modifieLe: entity.modifieLe,
    };
  }
}

export const presenceReunionService = new PresenceReunionService();
