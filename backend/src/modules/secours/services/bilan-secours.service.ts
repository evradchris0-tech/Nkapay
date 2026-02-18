/**
 * Service pour la gestion des bilans secours par exercice
 */

import { Repository } from 'typeorm';
import { AppDataSource } from '../../../config';
import { NotFoundError, BadRequestError } from '../../../shared';
import { BilanSecoursExercice } from '../entities/bilan-secours-exercice.entity';
import { Exercice } from '../../exercices/entities/exercice.entity';
import {
  BilanSecoursExerciceResponseDto,
  UpdateBilanSecoursDto
} from '../dto/bilan-secours.dto';

export class BilanSecoursService {
  private _bilanRepo?: Repository<BilanSecoursExercice>;
  private _exerciceRepo?: Repository<Exercice>;

  private get bilanSecoursRepository(): Repository<BilanSecoursExercice> {
    if (!this._bilanRepo) this._bilanRepo = AppDataSource.getRepository(BilanSecoursExercice);
    return this._bilanRepo;
  }

  private get exerciceRepository(): Repository<Exercice> {
    if (!this._exerciceRepo) this._exerciceRepo = AppDataSource.getRepository(Exercice);
    return this._exerciceRepo;
  }

  /**
   * Récupérer ou créer un bilan pour un exercice
   */
  async getOrCreate(exerciceId: string, soldeInitial: number = 0): Promise<BilanSecoursExerciceResponseDto> {
    let bilan = await this.bilanSecoursRepository.findOne({
      where: { exerciceId },
      relations: ['exercice']
    });

    if (!bilan) {
      const exercice = await this.exerciceRepository.findOne({
        where: { id: exerciceId }
      });

      if (!exercice) {
        throw new NotFoundError('Exercice non trouvé');
      }

      bilan = this.bilanSecoursRepository.create({
        exerciceId,
        soldeInitial,
        totalCotisations: 0,
        totalDepenses: 0,
        soldeFinal: soldeInitial,
        nombreEvenements: 0
      });

      await this.bilanSecoursRepository.save(bilan);
      bilan.exercice = exercice;
    }

    return this.formatResponse(bilan);
  }

  /**
   * Récupérer tous les bilans
   */
  async findAll(tontineId?: string): Promise<BilanSecoursExerciceResponseDto[]> {
    const queryBuilder = this.bilanSecoursRepository
      .createQueryBuilder('bilan')
      .leftJoinAndSelect('bilan.exercice', 'exercice')
      .leftJoinAndSelect('exercice.tontine', 'tontine');

    if (tontineId) {
      queryBuilder.andWhere('exercice.tontineId = :tontineId', { tontineId });
    }

    queryBuilder.orderBy('exercice.anneeDebut', 'DESC');

    const bilans = await queryBuilder.getMany();
    return bilans.map((b: BilanSecoursExercice) => this.formatResponse(b));
  }

  /**
   * Récupérer un bilan par ID
   */
  async findById(id: string): Promise<BilanSecoursExerciceResponseDto> {
    const bilan = await this.bilanSecoursRepository.findOne({
      where: { id },
      relations: ['exercice']
    });

    if (!bilan) {
      throw new NotFoundError('Bilan secours non trouvé');
    }

    return this.formatResponse(bilan);
  }

  /**
   * Mettre à jour le solde initial d'un bilan
   */
  async updateSoldeInitial(exerciceId: string, soldeInitial: number): Promise<BilanSecoursExerciceResponseDto> {
    let bilan = await this.bilanSecoursRepository.findOne({
      where: { exerciceId }
    });

    if (!bilan) {
      bilan = this.bilanSecoursRepository.create({
        exerciceId,
        soldeInitial,
        totalCotisations: 0,
        totalDepenses: 0,
        soldeFinal: soldeInitial,
        nombreEvenements: 0
      });
    } else {
      bilan.soldeInitial = soldeInitial;
      bilan.soldeFinal = soldeInitial + Number(bilan.totalCotisations) - Number(bilan.totalDepenses);
    }

    await this.bilanSecoursRepository.save(bilan);
    return this.getOrCreate(exerciceId);
  }

  /**
   * Mettre à jour un bilan
   */
  async update(id: string, data: UpdateBilanSecoursDto): Promise<BilanSecoursExerciceResponseDto> {
    const bilan = await this.bilanSecoursRepository.findOne({
      where: { id }
    });

    if (!bilan) {
      throw new NotFoundError('Bilan secours non trouvé');
    }

    if (data.soldeInitial !== undefined) {
      bilan.soldeInitial = data.soldeInitial;
    }
    if (data.totalCotisations !== undefined) {
      bilan.totalCotisations = data.totalCotisations;
    }
    if (data.totalDepenses !== undefined) {
      bilan.totalDepenses = data.totalDepenses;
    }

    // Recalculer le solde final
    bilan.soldeFinal = Number(bilan.soldeInitial) + Number(bilan.totalCotisations) - Number(bilan.totalDepenses);

    await this.bilanSecoursRepository.save(bilan);
    return this.findById(id);
  }

  /**
   * Recalculer le bilan à partir des données réelles
   */
  async recalculer(exerciceId: string): Promise<BilanSecoursExerciceResponseDto> {
    const bilan = await this.bilanSecoursRepository.findOne({
      where: { exerciceId }
    });

    if (!bilan) {
      throw new NotFoundError('Bilan secours non trouvé pour cet exercice');
    }

    // TODO: Récupérer les données réelles depuis les tables de transactions et demandes de secours
    // Pour l'instant, recalcule juste le solde final
    bilan.soldeFinal = Number(bilan.soldeInitial) + Number(bilan.totalCotisations) - Number(bilan.totalDepenses);

    await this.bilanSecoursRepository.save(bilan);
    return this.getOrCreate(exerciceId);
  }

  /**
   * Clôturer un bilan d'exercice et reporter le solde à l'exercice suivant
   */
  async cloturer(exerciceId: string, exerciceSuivantId?: string): Promise<BilanSecoursExerciceResponseDto> {
    const bilan = await this.bilanSecoursRepository.findOne({
      where: { exerciceId }
    });

    if (!bilan) {
      throw new NotFoundError('Bilan secours non trouvé pour cet exercice');
    }

    // Recalcul final
    bilan.soldeFinal = Number(bilan.soldeInitial) + Number(bilan.totalCotisations) - Number(bilan.totalDepenses);
    await this.bilanSecoursRepository.save(bilan);

    // Si exercice suivant spécifié, créer le nouveau bilan avec le solde reporté
    if (exerciceSuivantId) {
      await this.getOrCreate(exerciceSuivantId, bilan.soldeFinal);
    }

    return this.getOrCreate(exerciceId);
  }

  /**
   * Ajouter une cotisation au bilan
   */
  async ajouterCotisation(exerciceId: string, montant: number): Promise<void> {
    let bilan = await this.bilanSecoursRepository.findOne({
      where: { exerciceId }
    });

    if (!bilan) {
      bilan = this.bilanSecoursRepository.create({
        exerciceId,
        soldeInitial: 0,
        totalCotisations: 0,
        totalDepenses: 0,
        soldeFinal: 0,
        nombreEvenements: 0
      });
    }

    bilan.totalCotisations = Number(bilan.totalCotisations) + montant;
    bilan.soldeFinal = Number(bilan.soldeInitial) + Number(bilan.totalCotisations) - Number(bilan.totalDepenses);

    await this.bilanSecoursRepository.save(bilan);
  }

  /**
   * Ajouter une dépense (secours versé) au bilan
   */
  async ajouterDepense(exerciceId: string, montant: number): Promise<void> {
    let bilan = await this.bilanSecoursRepository.findOne({
      where: { exerciceId }
    });

    if (!bilan) {
      throw new NotFoundError('Bilan secours non trouvé');
    }

    bilan.totalDepenses = Number(bilan.totalDepenses) + montant;
    bilan.nombreEvenements = bilan.nombreEvenements + 1;
    bilan.soldeFinal = Number(bilan.soldeInitial) + Number(bilan.totalCotisations) - Number(bilan.totalDepenses);

    await this.bilanSecoursRepository.save(bilan);
  }

  private formatResponse(bilan: BilanSecoursExercice): BilanSecoursExerciceResponseDto {
    return {
      id: bilan.id,
      exerciceId: bilan.exerciceId,
      soldeInitial: Number(bilan.soldeInitial),
      totalCotisations: Number(bilan.totalCotisations),
      totalDepenses: Number(bilan.totalDepenses),
      soldeFinal: Number(bilan.soldeFinal),
      nombreEvenements: bilan.nombreEvenements,
      creeLe: bilan.creeLe
    };
  }
}

export const bilanSecoursService = new BilanSecoursService();
