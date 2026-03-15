/**
 * Service pour la gestion des règles au niveau exercice
 */

import { AppDataSource } from '../../../config';
import { NotFoundError, BadRequestError } from '../../../shared';
import { RegleExercice } from '../entities/regle-exercice.entity';
import { RuleDefinition } from '../../tontines/entities/rule-definition.entity';
import { RegleTontine } from '../../tontines/entities/regle-tontine.entity';
import { Exercice } from '../entities/exercice.entity';
import { 
  CreateRegleExerciceDto, 
  UpdateRegleExerciceDto, 
  RegleExerciceResponseDto 
} from '../dto/regle-exercice.dto';

export class RegleExerciceService {
  private regleExerciceRepository = AppDataSource.getRepository(RegleExercice);
  private ruleDefinitionRepository = AppDataSource.getRepository(RuleDefinition);
  private regleTontineRepository = AppDataSource.getRepository(RegleTontine);
  private exerciceRepository = AppDataSource.getRepository(Exercice);

  /**
   * Créer ou mettre à jour une règle pour un exercice
   */
  async upsert(data: CreateRegleExerciceDto): Promise<RegleExerciceResponseDto> {
    const exercice = await this.exerciceRepository.findOne({
      where: { id: data.exerciceId }
    });

    if (!exercice) {
      throw new NotFoundError('Exercice non trouvé');
    }

    const ruleDefinition = await this.ruleDefinitionRepository.findOne({
      where: { id: data.ruleDefinitionId }
    });

    if (!ruleDefinition) {
      throw new NotFoundError('Définition de règle non trouvée');
    }

    if (!ruleDefinition.estModifiableParExercice) {
      throw new BadRequestError('Cette règle ne peut pas être modifiée au niveau exercice');
    }

    let regleExercice = await this.regleExerciceRepository.findOne({
      where: { 
        exerciceId: data.exerciceId, 
        ruleDefinitionId: data.ruleDefinitionId 
      },
      relations: ['ruleDefinition']
    });

    if (regleExercice) {
      regleExercice.valeur = data.valeur;
      regleExercice.estSurchargee = true;
      regleExercice.modifieLe = new Date();
      if (data.modifieParExerciceMembreId) {
        regleExercice.modifieParExerciceMembreId = data.modifieParExerciceMembreId;
      }
    } else {
      regleExercice = this.regleExerciceRepository.create({
        exerciceId: data.exerciceId,
        ruleDefinitionId: data.ruleDefinitionId,
        valeur: data.valeur,
        estSurchargee: true,
        modifieLe: new Date(),
        modifieParExerciceMembreId: data.modifieParExerciceMembreId
      });
    }

    await this.regleExerciceRepository.save(regleExercice);

    regleExercice = await this.regleExerciceRepository.findOne({
      where: { id: regleExercice.id },
      relations: ['ruleDefinition']
    });

    return this.formatResponse(regleExercice!);
  }

  /**
   * Récupérer toutes les règles d'un exercice
   */
  async findByExercice(exerciceId: string): Promise<RegleExerciceResponseDto[]> {
    const regles = await this.regleExerciceRepository.find({
      where: { exerciceId },
      relations: ['ruleDefinition'],
      order: { creeLe: 'ASC' }
    });
    return regles.map((r: RegleExercice) => this.formatResponse(r));
  }

  /**
   * Récupérer les règles effectives d'un exercice (cascade: exercice -> tontine -> défaut)
   */
  async getEffectiveRules(exerciceId: string): Promise<any[]> {
    const exercice = await this.exerciceRepository.findOne({
      where: { id: exerciceId }
    });

    if (!exercice) {
      throw new NotFoundError('Exercice non trouvé');
    }

    const allDefinitions = await this.ruleDefinitionRepository.find({
      order: { categorie: 'ASC', ordreAffichage: 'ASC' }
    });

    const tontineRules = await this.regleTontineRepository.find({
      where: { tontineId: exercice.tontineId }
    });
    const tontineRulesMap = new Map(
      tontineRules.map((r: RegleTontine) => [r.ruleDefinitionId, r])
    );

    const exerciceRules = await this.regleExerciceRepository.find({
      where: { exerciceId }
    });
    const exerciceRulesMap = new Map(
      exerciceRules.map((r: RegleExercice) => [r.ruleDefinitionId, r])
    );

    return allDefinitions.map((def: RuleDefinition) => {
      const exerciceRule = exerciceRulesMap.get(def.id);
      const tontineRule = tontineRulesMap.get(def.id);

      let valeur = def.valeurDefaut;
      let source = 'DEFAUT';

      if (tontineRule?.estActive) {
        valeur = tontineRule.valeur;
        source = 'TONTINE';
      }

      if (exerciceRule?.estSurchargee) {
        valeur = exerciceRule.valeur;
        source = 'EXERCICE';
      }

      return {
        ruleDefinitionId: def.id,
        cle: def.cle,
        libelle: def.libelle,
        typeValeur: def.typeValeur,
        categorie: def.categorie,
        valeur,
        source,
        estModifiable: def.estModifiableParExercice
      };
    });
  }

  /**
   * Récupérer une règle spécifique
   */
  async findById(id: string): Promise<RegleExerciceResponseDto> {
    const regleExercice = await this.regleExerciceRepository.findOne({
      where: { id },
      relations: ['ruleDefinition']
    });

    if (!regleExercice) {
      throw new NotFoundError('Règle exercice non trouvée');
    }

    return this.formatResponse(regleExercice);
  }

  /**
   * Récupérer la valeur effective d'une règle par clé
   */
  async getEffectiveValueByCle(exerciceId: string, cle: string): Promise<string | null> {
    const exercice = await this.exerciceRepository.findOne({
      where: { id: exerciceId }
    });

    if (!exercice) {
      return null;
    }

    const ruleDefinition = await this.ruleDefinitionRepository.findOne({
      where: { cle }
    });

    if (!ruleDefinition) {
      return null;
    }

    const regleExercice = await this.regleExerciceRepository.findOne({
      where: { exerciceId, ruleDefinitionId: ruleDefinition.id }
    });

    if (regleExercice?.estSurchargee) {
      return regleExercice.valeur;
    }

    const regleTontine = await this.regleTontineRepository.findOne({
      where: { tontineId: exercice.tontineId, ruleDefinitionId: ruleDefinition.id }
    });

    if (regleTontine?.estActive) {
      return regleTontine.valeur;
    }

    return ruleDefinition.valeurDefaut;
  }

  /**
   * Mettre à jour une règle
   */
  async update(id: string, data: UpdateRegleExerciceDto): Promise<RegleExerciceResponseDto> {
    const regleExercice = await this.regleExerciceRepository.findOne({
      where: { id },
      relations: ['ruleDefinition']
    });

    if (!regleExercice) {
      throw new NotFoundError('Règle exercice non trouvée');
    }

    if (data.valeur !== undefined) {
      regleExercice.valeur = data.valeur;
    }
    if (data.estSurchargee !== undefined) {
      regleExercice.estSurchargee = data.estSurchargee;
    }
    if (data.modifieParExerciceMembreId) {
      regleExercice.modifieParExerciceMembreId = data.modifieParExerciceMembreId;
    }
    regleExercice.modifieLe = new Date();

    await this.regleExerciceRepository.save(regleExercice);
    return this.formatResponse(regleExercice);
  }

  /**
   * Supprimer une règle (revenir à la valeur tontine/défaut)
   */
  async delete(id: string): Promise<void> {
    const regleExercice = await this.regleExerciceRepository.findOne({
      where: { id }
    });

    if (!regleExercice) {
      throw new NotFoundError('Règle exercice non trouvée');
    }

    await this.regleExerciceRepository.remove(regleExercice);
  }

  /**
   * Copier les règles de la tontine pour un nouvel exercice
   */
  async initializeFromTontine(exerciceId: string, tontineId: string): Promise<void> {
    const tontineRules = await this.regleTontineRepository.find({
      where: { tontineId, estActive: true }
    });

    for (const rule of tontineRules) {
      const regleExercice = this.regleExerciceRepository.create({
        exerciceId,
        ruleDefinitionId: rule.ruleDefinitionId,
        valeur: rule.valeur,
        estSurchargee: false,
        modifieLe: new Date()
      });
      await this.regleExerciceRepository.save(regleExercice);
    }
  }

  private formatResponse(regleExercice: RegleExercice): RegleExerciceResponseDto {
    return {
      id: regleExercice.id,
      exerciceId: regleExercice.exerciceId,
      ruleDefinitionId: regleExercice.ruleDefinitionId,
      ruleDefinition: regleExercice.ruleDefinition ? {
        id: regleExercice.ruleDefinition.id,
        cle: regleExercice.ruleDefinition.cle,
        libelle: regleExercice.ruleDefinition.libelle,
        typeValeur: regleExercice.ruleDefinition.typeValeur,
        categorie: regleExercice.ruleDefinition.categorie
      } : undefined,
      valeur: regleExercice.valeur,
      estSurchargee: regleExercice.estSurchargee,
      modifieLe: regleExercice.modifieLe,
      modifieParExerciceMembreId: regleExercice.modifieParExerciceMembreId,
      creeLe: regleExercice.creeLe
    };
  }
}

export const regleExerciceService = new RegleExerciceService();
