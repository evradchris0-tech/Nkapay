/**
 * Service pour la gestion des adhesions aux tontines
 */

import { Repository } from 'typeorm';
import { AppDataSource } from '../../../config';
import { NotFoundError, BadRequestError } from '../../../shared';
import { AdhesionTontine, RoleMembre, StatutAdhesion } from '../entities/adhesion-tontine.entity';
import { Tontine } from '../entities/tontine.entity';
import { Utilisateur } from '../../utilisateurs/entities/utilisateur.entity';
import {
  CreateAdhesionDto,
  UpdateAdhesionDto,
  AdhesionResponseDto,
  AdhesionListItemDto,
  AdhesionFiltersDto,
} from '../dto/adhesion-tontine.dto';

export class AdhesionTontineService {
  private _adhesionRepo?: Repository<AdhesionTontine>;
  private _tontineRepo?: Repository<Tontine>;
  private _utilisateurRepo?: Repository<Utilisateur>;

  private get adhesionRepository(): Repository<AdhesionTontine> {
    if (!this._adhesionRepo) this._adhesionRepo = AppDataSource.getRepository(AdhesionTontine);
    return this._adhesionRepo;
  }

  private get tontineRepository(): Repository<Tontine> {
    if (!this._tontineRepo) this._tontineRepo = AppDataSource.getRepository(Tontine);
    return this._tontineRepo;
  }

  private get utilisateurRepository(): Repository<Utilisateur> {
    if (!this._utilisateurRepo) this._utilisateurRepo = AppDataSource.getRepository(Utilisateur);
    return this._utilisateurRepo;
  }

  /**
   * Creer une nouvelle adhesion
   */
  async create(dto: CreateAdhesionDto): Promise<AdhesionResponseDto> {
    // Verifier que la tontine existe
    const tontine = await this.tontineRepository.findOne({ where: { id: dto.tontineId } });
    if (!tontine) {
      throw new NotFoundError(`Tontine non trouvee: ${dto.tontineId}`);
    }

    // Verifier que l'utilisateur existe
    const utilisateur = await this.utilisateurRepository.findOne({ where: { id: dto.utilisateurId } });
    if (!utilisateur) {
      throw new NotFoundError(`Utilisateur non trouve: ${dto.utilisateurId}`);
    }

    // Verifier que l'utilisateur n'est pas deja membre
    const existingAdhesion = await this.adhesionRepository.findOne({
      where: { tontineId: dto.tontineId, utilisateurId: dto.utilisateurId },
    });
    if (existingAdhesion) {
      throw new BadRequestError('Cet utilisateur est deja membre de cette tontine');
    }

    // Verifier l'unicite du matricule dans la tontine
    const existingMatricule = await this.adhesionRepository.findOne({
      where: { tontineId: dto.tontineId, matricule: dto.matricule },
    });
    if (existingMatricule) {
      throw new BadRequestError(`Le matricule "${dto.matricule}" existe deja dans cette tontine`);
    }

    const adhesion = this.adhesionRepository.create({
      tontineId: dto.tontineId,
      utilisateurId: dto.utilisateurId,
      matricule: dto.matricule,
      role: dto.role || RoleMembre.MEMBRE,
      statut: StatutAdhesion.ACTIVE,
      dateAdhesionTontine: dto.dateAdhesionTontine || new Date(),
      photo: dto.photo || null,
      quartierResidence: dto.quartierResidence || null,
    });

    const saved = await this.adhesionRepository.save(adhesion);

    // Recharger avec les relations
    const reloaded = await this.adhesionRepository.findOne({
      where: { id: saved.id },
      relations: ['tontine', 'utilisateur'],
    });

    return this.toResponseDto(reloaded!);
  }

  /**
   * Lister les adhesions d'une tontine
   */
  async findByTontine(tontineId: string, filters?: AdhesionFiltersDto): Promise<AdhesionListItemDto[]> {
    const queryBuilder = this.adhesionRepository
      .createQueryBuilder('adhesion')
      .leftJoinAndSelect('adhesion.utilisateur', 'utilisateur')
      .where('adhesion.tontineId = :tontineId', { tontineId });

    if (filters?.role) {
      queryBuilder.andWhere('adhesion.role = :role', { role: filters.role });
    }
    if (filters?.statut) {
      queryBuilder.andWhere('adhesion.statut = :statut', { statut: filters.statut });
    }

    const adhesions = await queryBuilder
      .orderBy('adhesion.dateAdhesionTontine', 'ASC')
      .getMany();

    return adhesions.map((a) => this.toListItemDto(a));
  }

  /**
   * Trouver une adhesion par ID
   */
  async findById(id: string): Promise<AdhesionResponseDto> {
    const adhesion = await this.adhesionRepository.findOne({
      where: { id },
      relations: ['tontine', 'utilisateur'],
    });

    if (!adhesion) {
      throw new NotFoundError(`Adhesion non trouvee: ${id}`);
    }

    return this.toResponseDto(adhesion);
  }

  /**
   * Trouver l'adhesion d'un utilisateur a une tontine
   */
  async findByUserAndTontine(utilisateurId: string, tontineId: string): Promise<AdhesionResponseDto> {
    const adhesion = await this.adhesionRepository.findOne({
      where: { utilisateurId, tontineId },
      relations: ['tontine', 'utilisateur'],
    });

    if (!adhesion) {
      throw new NotFoundError('Adhesion non trouvee');
    }

    return this.toResponseDto(adhesion);
  }

  /**
   * Trouver toutes les adhesions d'un utilisateur
   */
  async findByUser(utilisateurId: string): Promise<AdhesionResponseDto[]> {
    const adhesions = await this.adhesionRepository.find({
      where: { utilisateurId },
      relations: ['tontine', 'utilisateur'],
      order: { dateAdhesionTontine: 'DESC' },
    });

    return adhesions.map((a) => this.toResponseDto(a));
  }

  /**
   * Mettre a jour une adhesion
   */
  async update(id: string, dto: UpdateAdhesionDto): Promise<AdhesionResponseDto> {
    const adhesion = await this.adhesionRepository.findOne({
      where: { id },
      relations: ['tontine', 'utilisateur'],
    });

    if (!adhesion) {
      throw new NotFoundError(`Adhesion non trouvee: ${id}`);
    }

    // Verifier l'unicite du nouveau matricule si change
    if (dto.matricule && dto.matricule !== adhesion.matricule) {
      const existingMatricule = await this.adhesionRepository.findOne({
        where: { tontineId: adhesion.tontineId, matricule: dto.matricule },
      });
      if (existingMatricule) {
        throw new BadRequestError(`Le matricule "${dto.matricule}" existe deja dans cette tontine`);
      }
    }

    if (dto.matricule !== undefined) adhesion.matricule = dto.matricule;
    if (dto.role !== undefined) adhesion.role = dto.role;
    if (dto.statut !== undefined) adhesion.statut = dto.statut;
    if (dto.photo !== undefined) adhesion.photo = dto.photo;
    if (dto.quartierResidence !== undefined) adhesion.quartierResidence = dto.quartierResidence;

    const updated = await this.adhesionRepository.save(adhesion);

    const reloaded = await this.adhesionRepository.findOne({
      where: { id: updated.id },
      relations: ['tontine', 'utilisateur'],
    });

    return this.toResponseDto(reloaded!);
  }

  /**
   * Desactiver une adhesion
   */
  async deactivate(id: string): Promise<AdhesionResponseDto> {
    return this.update(id, { statut: StatutAdhesion.INACTIVE });
  }

  /**
   * Reactiver une adhesion
   */
  async reactivate(id: string): Promise<AdhesionResponseDto> {
    return this.update(id, { statut: StatutAdhesion.ACTIVE });
  }

  /**
   * Changer le role d'un membre
   */
  async changeRole(id: string, role: RoleMembre): Promise<AdhesionResponseDto> {
    return this.update(id, { role });
  }

  /**
   * Compter les membres actifs d'une tontine
   */
  async countActiveMembers(tontineId: string): Promise<number> {
    return this.adhesionRepository.count({
      where: { tontineId, statut: StatutAdhesion.ACTIVE },
    });
  }

  /**
   * Supprimer une adhesion (soft delete)
   */
  async delete(id: string): Promise<void> {
    const adhesion = await this.adhesionRepository.findOne({ where: { id } });
    if (!adhesion) {
      throw new NotFoundError(`Adhesion non trouvee: ${id}`);
    }

    await this.adhesionRepository.softRemove(adhesion);
  }

  /**
   * Transformer en DTO de reponse
   */
  private toResponseDto(entity: AdhesionTontine): AdhesionResponseDto {
    return {
      id: entity.id,
      tontine: entity.tontine ? {
        id: entity.tontine.id,
        nom: entity.tontine.nom,
        nomCourt: entity.tontine.nomCourt,
      } : { id: '', nom: '', nomCourt: '' },
      utilisateur: entity.utilisateur ? {
        id: entity.utilisateur.id,
        nom: entity.utilisateur.nom,
        prenom: entity.utilisateur.prenom,
        telephone1: entity.utilisateur.telephone1,
      } : { id: '', nom: '', prenom: '', telephone1: '' },
      matricule: entity.matricule,
      role: entity.role,
      statut: entity.statut,
      dateAdhesionTontine: entity.dateAdhesionTontine,
      photo: entity.photo,
      quartierResidence: entity.quartierResidence,
      creeLe: entity.creeLe,
      modifieLe: entity.modifieLe,
    };
  }

  /**
   * Transformer en DTO de liste
   */
  private toListItemDto(entity: AdhesionTontine): AdhesionListItemDto {
    return {
      id: entity.id,
      utilisateur: entity.utilisateur ? {
        id: entity.utilisateur.id,
        nom: entity.utilisateur.nom,
        prenom: entity.utilisateur.prenom,
      } : { id: '', nom: '', prenom: '' },
      matricule: entity.matricule,
      role: entity.role,
      statut: entity.statut,
      dateAdhesionTontine: entity.dateAdhesionTontine,
    };
  }
}

export const adhesionTontineService = new AdhesionTontineService();
