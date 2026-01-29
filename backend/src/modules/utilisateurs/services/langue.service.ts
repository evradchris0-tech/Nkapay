/**
 * Service Langue
 * Gestion des langues du système
 */

import { AppDataSource } from '../../../config';
import { Langue } from '../entities/langue.entity';
import {
  CreateLangueDto,
  UpdateLangueDto,
  LangueResponseDto,
} from '../dto/langue.dto';
import { NotFoundError, BadRequestError } from '../../../shared';

const langueRepository = AppDataSource.getRepository(Langue);

export class LangueService {
  /**
   * Créer une nouvelle langue
   */
  async create(dto: CreateLangueDto): Promise<LangueResponseDto> {
    // Vérifier unicité du code
    const existing = await langueRepository.findOne({
      where: { code: dto.code },
    });

    if (existing) {
      throw new BadRequestError( `La langue avec le code '${dto.code}' existe déjà`);
    }

    // Si c'est la langue par défaut, désactiver les autres
    if (dto.estDefaut) {
      await langueRepository.update({}, { estDefaut: false });
    }

    const langue = langueRepository.create({
      code: dto.code,
      nom: dto.nom,
      estDefaut: dto.estDefaut ?? false,
    });

    const saved = await langueRepository.save(langue);
    return this.toResponseDto(saved);
  }

  /**
   * Récupérer toutes les langues
   */
  async findAll(): Promise<LangueResponseDto[]> {
    const langues = await langueRepository.find({
      order: { nom: 'ASC' },
    });
    return langues.map((l) => this.toResponseDto(l));
  }

  /**
   * Récupérer une langue par ID
   */
  async findById(id: string): Promise<LangueResponseDto> {
    const langue = await langueRepository.findOne({ where: { id } });

    if (!langue) {
      throw new NotFoundError( 'Langue non trouvée');
    }

    return this.toResponseDto(langue);
  }

  /**
   * Récupérer une langue par code
   */
  async findByCode(code: string): Promise<LangueResponseDto> {
    const langue = await langueRepository.findOne({ where: { code } });

    if (!langue) {
      throw new NotFoundError( 'Langue non trouvée');
    }

    return this.toResponseDto(langue);
  }

  /**
   * Récupérer la langue par défaut
   */
  async findDefault(): Promise<LangueResponseDto | null> {
    const langue = await langueRepository.findOne({ where: { estDefaut: true } });
    return langue ? this.toResponseDto(langue) : null;
  }

  /**
   * Mettre à jour une langue
   */
  async update(id: string, dto: UpdateLangueDto): Promise<LangueResponseDto> {
    const langue = await langueRepository.findOne({ where: { id } });

    if (!langue) {
      throw new NotFoundError( 'Langue non trouvée');
    }

    // Si on définit cette langue comme défaut, désactiver les autres
    if (dto.estDefaut === true) {
      await langueRepository.update({}, { estDefaut: false });
    }

    if (dto.nom !== undefined) langue.nom = dto.nom;
    if (dto.estDefaut !== undefined) langue.estDefaut = dto.estDefaut;

    const updated = await langueRepository.save(langue);
    return this.toResponseDto(updated);
  }

  /**
   * Supprimer une langue
   */
  async delete(id: string): Promise<void> {
    const langue = await langueRepository.findOne({
      where: { id },
      relations: ['utilisateurs'],
    });

    if (!langue) {
      throw new NotFoundError( 'Langue non trouvée');
    }

    if (langue.estDefaut) {
      throw new BadRequestError( 'Impossible de supprimer la langue par défaut');
    }

    if (langue.utilisateurs && langue.utilisateurs.length > 0) {
      throw new BadRequestError( 'Cette langue est utilisée par des utilisateurs');
    }

    await langueRepository.remove(langue);
  }

  /**
   * Convertir en DTO de réponse
   */
  private toResponseDto(entity: Langue): LangueResponseDto {
    return {
      id: entity.id,
      code: entity.code,
      nom: entity.nom,
      estDefaut: entity.estDefaut,
    };
  }
}

export const langueService = new LangueService();
