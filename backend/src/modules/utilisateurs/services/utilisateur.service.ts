/**
 * Service Utilisateur
 * Gestion des utilisateurs du systeme
 */

import { Repository, SelectQueryBuilder } from 'typeorm';
import { PaginationQuery, PaginatedResult, paginateRaw, paginate } from '../../../shared';
import { AppDataSource } from '../../../config/database.config';
import { Utilisateur } from '../entities/utilisateur.entity';
import {
  CreateUtilisateurDto,
  UpdateUtilisateurDto,
  UtilisateurResponseDto,
  UtilisateurFiltersDto,
} from '../dtos/utilisateur.dto';
import { NotFoundError, ConflictError, BadRequestError } from '../../../shared/errors/app-error';
import { hashPassword, verifyPassword } from '../../auth/utils/password.util';

import { BaseCrudService } from '../../../shared/services/base-crud.service';

export class UtilisateurService extends BaseCrudService<
  Utilisateur,
  CreateUtilisateurDto,
  UpdateUtilisateurDto,
  UtilisateurResponseDto,
  UtilisateurFiltersDto
> {
  private _repository?: Repository<Utilisateur>;

  protected get repository(): Repository<Utilisateur> {
    if (!this._repository) this._repository = AppDataSource.getRepository(Utilisateur);
    return this._repository;
  }

  protected getRelations(): string[] {
    return ['languePreferee'];
  }

  protected applyFilters(
    query: SelectQueryBuilder<Utilisateur>,
    filters?: UtilisateurFiltersDto
  ): void {
    if (!filters) return;

    if (filters.search) {
      query.andWhere(
        '(e.prenom LIKE :search OR e.nom LIKE :search)',
        { search: `%${filters.search}%` }
      );
    }

    if (filters.telephone) {
      query.andWhere('e.telephone1 LIKE :telephone', { telephone: `%${filters.telephone}%` });
    }

    if (filters.estSuperAdmin !== undefined) {
      query.andWhere('e.estSuperAdmin = :estSuperAdmin', { estSuperAdmin: filters.estSuperAdmin });
    }

    if (filters.organisationId) {
      query
        .innerJoin('membre_organisation', 'mo', 'mo.utilisateur_id = e.id')
        .andWhere('mo.organisation_id = :organisationId', { organisationId: filters.organisationId })
        .andWhere('mo.statut = :statutMo', { statutMo: 'ACTIVE' });
    }
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
  async create(dto: CreateUtilisateurDto): Promise<UtilisateurResponseDto> {
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

    const saved = await this.repository.save(utilisateur);
    return this.toResponseDto(saved);
  }

  /**
   * Mise a jour d'un utilisateur
   */
  async update(id: string, dto: UpdateUtilisateurDto): Promise<UtilisateurResponseDto> {
    const raw = await this.repository.findOne({ where: { id } as any });
    if (!raw) throw new NotFoundError('Utilisateur non trouve');

    // Mise a jour des champs modifiables
    if (dto.prenom !== undefined) raw.prenom = dto.prenom;
    if (dto.nom !== undefined) raw.nom = dto.nom;
    if (dto.telephone2 !== undefined) raw.telephone2 = dto.telephone2 || null;
    if (dto.adresseResidence !== undefined) raw.adresseResidence = dto.adresseResidence || null;
    if (dto.nomContactUrgence !== undefined) raw.nomContactUrgence = dto.nomContactUrgence || null;
    if (dto.telContactUrgence !== undefined) raw.telContactUrgence = dto.telContactUrgence || null;
    if (dto.numeroMobileMoney !== undefined) raw.numeroMobileMoney = dto.numeroMobileMoney || null;
    if (dto.numeroOrangeMoney !== undefined) raw.numeroOrangeMoney = dto.numeroOrangeMoney || null;
    if (dto.languePrefereeId !== undefined) raw.languePrefereeId = dto.languePrefereeId || null;

    const saved = await this.repository.save(raw);
    return this.toResponseDto(saved);
  }

  /**
   * Changement de mot de passe
   */
  async changePassword(
    id: string,
    ancienMotDePasse: string,
    nouveauMotDePasse: string
  ): Promise<void> {
    const utilisateur = await this.repository.findOne({ where: { id } as any });
    if (!utilisateur) throw new NotFoundError('Utilisateur non trouve');

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
   * Conversion vers DTO de reponse (sans donnees sensibles)
   */
  public toResponseDto(utilisateur: Utilisateur): UtilisateurResponseDto {
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
