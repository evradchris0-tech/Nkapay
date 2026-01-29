/**
 * Service pour la gestion des règles au niveau tontine
 */

import { AppDataSource } from '../../../config';
import { NotFoundError, BadRequestError } from '../../../shared';
import { RegleTontine } from '../entities/regle-tontine.entity';
import { RuleDefinition } from '../entities/rule-definition.entity';
import { Tontine } from '../entities/tontine.entity';
import { 
  CreateRegleTontineDto, 
  UpdateRegleTontineDto, 
  RegleTontineResponseDto 
} from '../dto/regle-tontine.dto';

export class RegleTontineService {
  private regleTontineRepository = AppDataSource.getRepository(RegleTontine);
  private ruleDefinitionRepository = AppDataSource.getRepository(RuleDefinition);
  private tontineRepository = AppDataSource.getRepository(Tontine);

  /**
   * Créer ou mettre à jour une règle pour une tontine
   */
  async upsert(data: CreateRegleTontineDto): Promise<RegleTontineResponseDto> {
    const tontine = await this.tontineRepository.findOne({
      where: { id: data.tontineId }
    });

    if (!tontine) {
      throw new NotFoundError('Tontine non trouvée');
    }

    const ruleDefinition = await this.ruleDefinitionRepository.findOne({
      where: { id: data.ruleDefinitionId }
    });

    if (!ruleDefinition) {
      throw new NotFoundError('Définition de règle non trouvée');
    }

    if (!ruleDefinition.estModifiableParTontine) {
      throw new BadRequestError('Cette règle ne peut pas être modifiée au niveau tontine');
    }

    let regleTontine = await this.regleTontineRepository.findOne({
      where: { 
        tontineId: data.tontineId, 
        ruleDefinitionId: data.ruleDefinitionId 
      },
      relations: ['ruleDefinition']
    });

    if (regleTontine) {
      regleTontine.valeur = data.valeur;
      regleTontine.modifieLe = new Date();
      if (data.modifieParAdhesionTontineId) {
        regleTontine.modifieParAdhesionTontineId = data.modifieParAdhesionTontineId;
      }
    } else {
      regleTontine = this.regleTontineRepository.create({
        tontineId: data.tontineId,
        ruleDefinitionId: data.ruleDefinitionId,
        valeur: data.valeur,
        estActive: true,
        modifieLe: new Date(),
        modifieParAdhesionTontineId: data.modifieParAdhesionTontineId
      });
    }

    await this.regleTontineRepository.save(regleTontine);

    regleTontine = await this.regleTontineRepository.findOne({
      where: { id: regleTontine.id },
      relations: ['ruleDefinition']
    });

    return this.formatResponse(regleTontine!);
  }

  /**
   * Récupérer toutes les règles d'une tontine
   */
  async findByTontine(tontineId: string): Promise<RegleTontineResponseDto[]> {
    const regles = await this.regleTontineRepository.find({
      where: { tontineId },
      relations: ['ruleDefinition'],
      order: { creeLe: 'ASC' }
    });
    return regles.map((r: RegleTontine) => this.formatResponse(r));
  }

  /**
   * Récupérer les règles effectives d'une tontine (avec valeurs par défaut)
   */
  async getEffectiveRules(tontineId: string): Promise<any[]> {
    const allDefinitions = await this.ruleDefinitionRepository.find({
      where: { estModifiableParTontine: true },
      order: { categorie: 'ASC', ordreAffichage: 'ASC' }
    });

    const tontineRules = await this.regleTontineRepository.find({
      where: { tontineId },
      relations: ['ruleDefinition']
    });

    const tontineRulesMap = new Map(
      tontineRules.map((r: RegleTontine) => [r.ruleDefinitionId, r])
    );

    return allDefinitions.map((def: RuleDefinition) => {
      const customRule = tontineRulesMap.get(def.id);
      return {
        ruleDefinitionId: def.id,
        cle: def.cle,
        libelle: def.libelle,
        typeValeur: def.typeValeur,
        categorie: def.categorie,
        valeur: customRule?.valeur ?? def.valeurDefaut,
        estPersonnalisee: !!customRule,
        estActive: customRule?.estActive ?? true
      };
    });
  }

  /**
   * Récupérer une règle spécifique
   */
  async findById(id: string): Promise<RegleTontineResponseDto> {
    const regleTontine = await this.regleTontineRepository.findOne({
      where: { id },
      relations: ['ruleDefinition']
    });

    if (!regleTontine) {
      throw new NotFoundError('Règle tontine non trouvée');
    }

    return this.formatResponse(regleTontine);
  }

  /**
   * Récupérer la valeur d'une règle par clé
   */
  async getValueByCle(tontineId: string, cle: string): Promise<string | null> {
    const ruleDefinition = await this.ruleDefinitionRepository.findOne({
      where: { cle }
    });

    if (!ruleDefinition) {
      return null;
    }

    const regleTontine = await this.regleTontineRepository.findOne({
      where: { tontineId, ruleDefinitionId: ruleDefinition.id }
    });

    return regleTontine?.valeur ?? ruleDefinition.valeurDefaut;
  }

  /**
   * Mettre à jour une règle
   */
  async update(id: string, data: UpdateRegleTontineDto): Promise<RegleTontineResponseDto> {
    const regleTontine = await this.regleTontineRepository.findOne({
      where: { id },
      relations: ['ruleDefinition']
    });

    if (!regleTontine) {
      throw new NotFoundError('Règle tontine non trouvée');
    }

    if (data.valeur !== undefined) {
      regleTontine.valeur = data.valeur;
    }
    if (data.estActive !== undefined) {
      regleTontine.estActive = data.estActive;
    }
    if (data.modifieParAdhesionTontineId) {
      regleTontine.modifieParAdhesionTontineId = data.modifieParAdhesionTontineId;
    }
    regleTontine.modifieLe = new Date();

    await this.regleTontineRepository.save(regleTontine);
    return this.formatResponse(regleTontine);
  }

  /**
   * Supprimer une règle (revenir à la valeur par défaut)
   */
  async delete(id: string): Promise<void> {
    const regleTontine = await this.regleTontineRepository.findOne({
      where: { id }
    });

    if (!regleTontine) {
      throw new NotFoundError('Règle tontine non trouvée');
    }

    await this.regleTontineRepository.remove(regleTontine);
  }

  /**
   * Initialiser les règles par défaut pour une tontine
   */
  async initializeDefaultRules(tontineId: string, adhesionTontineId: string): Promise<void> {
    const obligatoryRules = await this.ruleDefinitionRepository.find({
      where: { estObligatoire: true, estModifiableParTontine: true }
    });

    for (const rule of obligatoryRules) {
      if (rule.valeurDefaut) {
        await this.upsert({
          tontineId,
          ruleDefinitionId: rule.id,
          valeur: rule.valeurDefaut,
          modifieParAdhesionTontineId: adhesionTontineId
        });
      }
    }
  }

  private formatResponse(regleTontine: RegleTontine): RegleTontineResponseDto {
    return {
      id: regleTontine.id,
      tontineId: regleTontine.tontineId,
      ruleDefinitionId: regleTontine.ruleDefinitionId,
      ruleDefinition: regleTontine.ruleDefinition ? {
        id: regleTontine.ruleDefinition.id,
        cle: regleTontine.ruleDefinition.cle,
        libelle: regleTontine.ruleDefinition.libelle,
        typeValeur: regleTontine.ruleDefinition.typeValeur,
        categorie: regleTontine.ruleDefinition.categorie
      } : undefined,
      valeur: regleTontine.valeur,
      estActive: regleTontine.estActive,
      modifieLe: regleTontine.modifieLe,
      modifieParAdhesionTontineId: regleTontine.modifieParAdhesionTontineId,
      creeLe: regleTontine.creeLe
    };
  }
}

export const regleTontineService = new RegleTontineService();
