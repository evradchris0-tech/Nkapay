/**
 * Service pour la gestion des projets d'exercice
 */

import { AppDataSource } from '../../../config';
import { NotFoundError, BadRequestError } from '../../../shared';
import { Projet } from '../entities/projet.entity';
import { Exercice } from '../../exercices/entities/exercice.entity';
import { ExerciceMembre } from '../../exercices/entities/exercice-membre.entity';
import {
  CreateProjetDto,
  UpdateProjetDto,
  ProjetResponseDto,
  ProjetFiltersDto
} from '../dto/projet.dto';

export class ProjetService {
  private projetRepository = AppDataSource.getRepository(Projet);
  private exerciceRepository = AppDataSource.getRepository(Exercice);
  private exerciceMembreRepository = AppDataSource.getRepository(ExerciceMembre);

  /**
   * Créer un nouveau projet
   */
  async create(data: CreateProjetDto): Promise<ProjetResponseDto> {
    const exercice = await this.exerciceRepository.findOne({
      where: { id: data.exerciceId }
    });

    if (!exercice) {
      throw new NotFoundError('Exercice non trouvé');
    }

    const createur = await this.exerciceMembreRepository.findOne({
      where: { id: data.creeParExerciceMembreId }
    });

    if (!createur) {
      throw new NotFoundError('Créateur non trouvé');
    }

    const projet = this.projetRepository.create({
      exerciceId: data.exerciceId,
      nom: data.nom,
      description: data.description || null,
      budgetPrevu: data.budgetPrevu || null,
      creeParExerciceMembreId: data.creeParExerciceMembreId,
      statut: 'ACTIF'
    });

    await this.projetRepository.save(projet);
    return this.findById(projet.id);
  }

  /**
   * Récupérer tous les projets avec filtres
   */
  async findAll(filters?: ProjetFiltersDto): Promise<ProjetResponseDto[]> {
    const queryBuilder = this.projetRepository
      .createQueryBuilder('projet')
      .leftJoinAndSelect('projet.exercice', 'exercice')
      .leftJoinAndSelect('projet.creeParExerciceMembre', 'createur')
      .leftJoinAndSelect('createur.membre', 'membreCreateur');

    if (filters?.exerciceId) {
      queryBuilder.andWhere('projet.exerciceId = :exerciceId', { exerciceId: filters.exerciceId });
    }

    if (filters?.statut) {
      queryBuilder.andWhere('projet.statut = :statut', { statut: filters.statut });
    }

    queryBuilder.orderBy('projet.creeLe', 'DESC');

    const projets = await queryBuilder.getMany();
    return projets.map((p: Projet) => this.formatResponse(p));
  }

  /**
   * Récupérer les projets d'un exercice
   */
  async findByExercice(exerciceId: string): Promise<ProjetResponseDto[]> {
    const projets = await this.projetRepository.find({
      where: { exerciceId },
      relations: ['exercice', 'creeParExerciceMembre', 'creeParExerciceMembre.membre'],
      order: { creeLe: 'DESC' }
    });
    return projets.map((p: Projet) => this.formatResponse(p));
  }

  /**
   * Récupérer un projet par ID
   */
  async findById(id: string): Promise<ProjetResponseDto> {
    const projet = await this.projetRepository.findOne({
      where: { id },
      relations: ['exercice', 'creeParExerciceMembre', 'creeParExerciceMembre.membre']
    });

    if (!projet) {
      throw new NotFoundError('Projet non trouvé');
    }

    return this.formatResponse(projet);
  }

  /**
   * Mettre à jour un projet
   */
  async update(id: string, data: UpdateProjetDto): Promise<ProjetResponseDto> {
    const projet = await this.projetRepository.findOne({
      where: { id }
    });

    if (!projet) {
      throw new NotFoundError('Projet non trouvé');
    }

    if (data.nom !== undefined) projet.nom = data.nom;
    if (data.description !== undefined) projet.description = data.description || null;
    if (data.budgetPrevu !== undefined) projet.budgetPrevu = data.budgetPrevu || null;
    if (data.statut !== undefined) projet.statut = data.statut;

    await this.projetRepository.save(projet);
    return this.findById(id);
  }

  /**
   * Clôturer un projet
   */
  async cloturer(id: string): Promise<ProjetResponseDto> {
    const projet = await this.projetRepository.findOne({
      where: { id }
    });

    if (!projet) {
      throw new NotFoundError('Projet non trouvé');
    }

    if (projet.statut === 'CLOTURE') {
      throw new BadRequestError('Ce projet est déjà clôturé');
    }

    projet.statut = 'CLOTURE';
    projet.clotureLe = new Date();

    await this.projetRepository.save(projet);
    return this.findById(id);
  }

  /**
   * Annuler un projet
   */
  async annuler(id: string): Promise<ProjetResponseDto> {
    const projet = await this.projetRepository.findOne({
      where: { id }
    });

    if (!projet) {
      throw new NotFoundError('Projet non trouvé');
    }

    if (projet.statut === 'ANNULE') {
      throw new BadRequestError('Ce projet est déjà annulé');
    }

    projet.statut = 'ANNULE';

    await this.projetRepository.save(projet);
    return this.findById(id);
  }

  /**
   * Supprimer un projet (soft delete)
   */
  async delete(id: string): Promise<void> {
    const projet = await this.projetRepository.findOne({
      where: { id }
    });

    if (!projet) {
      throw new NotFoundError('Projet non trouvé');
    }

    await this.projetRepository.softRemove(projet);
  }

  /**
   * Statistiques des projets d'un exercice
   */
  async getStatsByExercice(exerciceId: string): Promise<{
    total: number;
    actifs: number;
    clotures: number;
    annules: number;
    budgetPrevuTotal: number;
  }> {
    const projets = await this.projetRepository.find({
      where: { exerciceId }
    });

    const stats = {
      total: projets.length,
      actifs: 0,
      clotures: 0,
      annules: 0,
      budgetPrevuTotal: 0
    };

    projets.forEach((p: Projet) => {
      if (p.statut === 'ACTIF') stats.actifs++;
      else if (p.statut === 'CLOTURE') stats.clotures++;
      else if (p.statut === 'ANNULE') stats.annules++;
      stats.budgetPrevuTotal += Number(p.budgetPrevu) || 0;
    });

    return stats;
  }

  private formatResponse(projet: Projet): ProjetResponseDto {
    return {
      id: projet.id,
      exerciceId: projet.exerciceId,
      nom: projet.nom,
      description: projet.description,
      budgetPrevu: projet.budgetPrevu,
      statut: projet.statut,
      creeParExerciceMembreId: projet.creeParExerciceMembreId,
      creeLe: projet.creeLe,
      clotureLe: projet.clotureLe
    };
  }
}

export const projetService = new ProjetService();
