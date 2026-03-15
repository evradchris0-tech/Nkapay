/**
 * Service Utilisateur
 * Gestion des utilisateurs du systeme
 */

import { Repository } from 'typeorm';
import { PaginationQuery, PaginatedResult, paginateRaw } from '../../../shared';
import { AppDataSource } from '../../../config/database.config';
import { Utilisateur } from '../entities/utilisateur.entity';
import {
  CreateUtilisateurDto,
  UpdateUtilisateurDto,
  UtilisateurResponseDto,
} from '../dtos/utilisateur.dto';
import { NotFoundError, ConflictError, BadRequestError } from '../../../shared/errors/app-error';
import { hashPassword, verifyPassword } from '../../auth/utils/password.util';

export class UtilisateurService {
  private _repository?: Repository<Utilisateur>;

  private get repository(): Repository<Utilisateur> {
    if (!this._repository) this._repository = AppDataSource.getRepository(Utilisateur);
    return this._repository;
  }

  /**
   * Recherche un utilisateur par ID
   */
  async findById(id: string): Promise<Utilisateur> {
    const utilisateur = await this.repository.findOne({
      where: { id },
      relations: ['languePreferee'],
    });

    if (!utilisateur) {
      throw new NotFoundError('Utilisateur non trouve');
    }

    return utilisateur;
  }

  /**
   * Recherche un utilisateur par numero de telephone
   */
  async findByTelephone(telephone: string): Promise<Utilisateur | null> {
    return this.repository.findOne({
      where: [{ telephone1: telephone }, { telephone2: telephone }],
    });
  }

  /**
   * Creation d'un nouvel utilisateur
   */
  async create(dto: CreateUtilisateurDto): Promise<Utilisateur> {
    // Verification de l'unicite du telephone
    const existant = await this.findByTelephone(dto.telephone1);
    if (existant) {
      throw new ConflictError('Ce numero de telephone est deja utilise');
    }

    if (dto.telephone2) {
      const existant2 = await this.findByTelephone(dto.telephone2);
      if (existant2) {
        throw new ConflictError('Le numero de telephone secondaire est deja utilise');
      }
    }

    // Hashage du mot de passe
    const passwordHash = await hashPassword(dto.password);

    const utilisateur = this.repository.create({
      prenom: dto.prenom,
      nom: dto.nom,
      telephone1: dto.telephone1,
      telephone2: dto.telephone2 || null,
      adresseResidence: dto.adresseResidence || null,
      nomContactUrgence: dto.nomContactUrgence || null,
      telContactUrgence: dto.telContactUrgence || null,
      numeroMobileMoney: dto.numeroMobileMoney || null,
      numeroOrangeMoney: dto.numeroOrangeMoney || null,
      passwordHash,
      doitChangerMotDePasse: true,
      estSuperAdmin: false,
      languePrefereeId: dto.languePrefereeId || null,
    });

    return this.repository.save(utilisateur);
  }

  /**
   * Mise a jour d'un utilisateur
   */
  async update(id: string, dto: UpdateUtilisateurDto): Promise<Utilisateur> {
    const utilisateur = await this.findById(id);

    // Mise a jour des champs modifiables
    if (dto.prenom !== undefined) utilisateur.prenom = dto.prenom;
    if (dto.nom !== undefined) utilisateur.nom = dto.nom;
    if (dto.telephone2 !== undefined) utilisateur.telephone2 = dto.telephone2 || null;
    if (dto.adresseResidence !== undefined) utilisateur.adresseResidence = dto.adresseResidence || null;
    if (dto.nomContactUrgence !== undefined) utilisateur.nomContactUrgence = dto.nomContactUrgence || null;
    if (dto.telContactUrgence !== undefined) utilisateur.telContactUrgence = dto.telContactUrgence || null;
    if (dto.numeroMobileMoney !== undefined) utilisateur.numeroMobileMoney = dto.numeroMobileMoney || null;
    if (dto.numeroOrangeMoney !== undefined) utilisateur.numeroOrangeMoney = dto.numeroOrangeMoney || null;
    if (dto.languePrefereeId !== undefined) utilisateur.languePrefereeId = dto.languePrefereeId || null;

    return this.repository.save(utilisateur);
  }

  /**
   * Changement de mot de passe
   */
  async changePassword(
    id: string,
    ancienMotDePasse: string,
    nouveauMotDePasse: string
  ): Promise<void> {
    const utilisateur = await this.findById(id);

    // Verification de l'ancien mot de passe
    const isValid = await verifyPassword(ancienMotDePasse, utilisateur.passwordHash);
    if (!isValid) {
      throw new BadRequestError('Ancien mot de passe incorrect');
    }

    // Hashage et sauvegarde du nouveau mot de passe
    utilisateur.passwordHash = await hashPassword(nouveauMotDePasse);
    utilisateur.doitChangerMotDePasse = false;
    utilisateur.motDePasseModifieLe = new Date();

    await this.repository.save(utilisateur);
  }

  /**
   * Suppression logique d'un utilisateur
   */
  async softDelete(id: string): Promise<void> {
    const utilisateur = await this.findById(id);
    await this.repository.softRemove(utilisateur);
  }

  /**
   * Liste des utilisateurs avec pagination
   */
  async findAll(pagination: PaginationQuery = {}): Promise<PaginatedResult<Utilisateur>> {
    const page = Math.max(1, Number(pagination.page) || 1);
    const limit = Math.min(Math.max(1, Number(pagination.limit) || 20), 100);

    const [data, total] = await this.repository.findAndCount({
      order: { creeLe: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
      relations: ['languePreferee'],
    });

    return paginateRaw(data, total, { page, limit });
  }

  /**
   * Conversion vers DTO de reponse (sans donnees sensibles)
   */
  toResponseDto(utilisateur: Utilisateur): UtilisateurResponseDto {
    return {
      id: utilisateur.id,
      prenom: utilisateur.prenom,
      nom: utilisateur.nom,
      nomComplet: utilisateur.nomComplet,
      telephone1: utilisateur.telephone1,
      telephone2: utilisateur.telephone2,
      adresseResidence: utilisateur.adresseResidence,
      nomContactUrgence: utilisateur.nomContactUrgence,
      telContactUrgence: utilisateur.telContactUrgence,
      numeroMobileMoney: utilisateur.numeroMobileMoney,
      numeroOrangeMoney: utilisateur.numeroOrangeMoney,
      dateInscription: utilisateur.dateInscription,
      doitChangerMotDePasse: utilisateur.doitChangerMotDePasse,
      estSuperAdmin: utilisateur.estSuperAdmin,
      languePrefereeId: utilisateur.languePrefereeId,
      creeLe: utilisateur.creeLe,
      modifieLe: utilisateur.modifieLe,
    };
  }
}
