/**
 * Service pour la gestion du catalogue des définitions de règles
 */

import { AppDataSource } from '../../../config';
import { NotFoundError, BadRequestError } from '../../../shared';
import { RuleDefinition, CategorieRegle, TypeValeurRegle } from '../entities/rule-definition.entity';
import { 
  CreateRuleDefinitionDto, 
  UpdateRuleDefinitionDto, 
  RuleDefinitionResponseDto,
  RuleDefinitionFiltersDto 
} from '../dto/rule-definition.dto';

export class RuleDefinitionService {
  private ruleDefinitionRepository = AppDataSource.getRepository(RuleDefinition);

  /**
   * Créer une nouvelle définition de règle
   */
  async create(data: CreateRuleDefinitionDto): Promise<RuleDefinitionResponseDto> {
    // Vérifier que la clé n'existe pas déjà
    const existing = await this.ruleDefinitionRepository.findOne({
      where: { cle: data.cle }
    });

    if (existing) {
      throw new BadRequestError(`Une règle avec la clé "${data.cle}" existe déjà`);
    }

    const ruleDefinition = this.ruleDefinitionRepository.create({
      cle: data.cle,
      libelle: data.libelle,
      typeValeur: data.typeValeur,
      valeurDefaut: data.valeurDefaut,
      valeurMin: data.valeurMin,
      valeurMax: data.valeurMax,
      unite: data.unite,
      estObligatoire: data.estObligatoire ?? false,
      estModifiableParTontine: data.estModifiableParTontine ?? true,
      estModifiableParExercice: data.estModifiableParExercice ?? true,
      categorie: data.categorie,
      description: data.description,
      ordreAffichage: data.ordreAffichage ?? 0
    });

    await this.ruleDefinitionRepository.save(ruleDefinition);
    return this.formatResponse(ruleDefinition);
  }

  /**
   * Récupérer toutes les définitions avec filtres
   */
  async findAll(filters?: RuleDefinitionFiltersDto): Promise<RuleDefinitionResponseDto[]> {
    const queryBuilder = this.ruleDefinitionRepository
      .createQueryBuilder('rd')
      .orderBy('rd.categorie', 'ASC')
      .addOrderBy('rd.ordreAffichage', 'ASC');

    if (filters?.categorie) {
      queryBuilder.andWhere('rd.categorie = :categorie', { categorie: filters.categorie });
    }

    if (filters?.typeValeur) {
      queryBuilder.andWhere('rd.typeValeur = :typeValeur', { typeValeur: filters.typeValeur });
    }

    if (filters?.estObligatoire !== undefined) {
      queryBuilder.andWhere('rd.estObligatoire = :estObligatoire', { 
        estObligatoire: filters.estObligatoire 
      });
    }

    const ruleDefinitions = await queryBuilder.getMany();
    return ruleDefinitions.map((rd: RuleDefinition) => this.formatResponse(rd));
  }

  /**
   * Récupérer par catégorie
   */
  async findByCategorie(categorie: CategorieRegle): Promise<RuleDefinitionResponseDto[]> {
    const ruleDefinitions = await this.ruleDefinitionRepository.find({
      where: { categorie },
      order: { ordreAffichage: 'ASC' }
    });
    return ruleDefinitions.map((rd: RuleDefinition) => this.formatResponse(rd));
  }

  /**
   * Récupérer par ID
   */
  async findById(id: string): Promise<RuleDefinitionResponseDto> {
    const ruleDefinition = await this.ruleDefinitionRepository.findOne({
      where: { id }
    });

    if (!ruleDefinition) {
      throw new NotFoundError('Définition de règle non trouvée');
    }

    return this.formatResponse(ruleDefinition);
  }

  /**
   * Récupérer par clé
   */
  async findByCle(cle: string): Promise<RuleDefinitionResponseDto> {
    const ruleDefinition = await this.ruleDefinitionRepository.findOne({
      where: { cle }
    });

    if (!ruleDefinition) {
      throw new NotFoundError(`Règle avec la clé "${cle}" non trouvée`);
    }

    return this.formatResponse(ruleDefinition);
  }

  /**
   * Mettre à jour une définition de règle
   */
  async update(id: string, data: UpdateRuleDefinitionDto): Promise<RuleDefinitionResponseDto> {
    const ruleDefinition = await this.ruleDefinitionRepository.findOne({
      where: { id }
    });

    if (!ruleDefinition) {
      throw new NotFoundError('Définition de règle non trouvée');
    }

    Object.assign(ruleDefinition, data);
    await this.ruleDefinitionRepository.save(ruleDefinition);
    return this.formatResponse(ruleDefinition);
  }

  /**
   * Supprimer une définition de règle
   */
  async delete(id: string): Promise<void> {
    const ruleDefinition = await this.ruleDefinitionRepository.findOne({
      where: { id }
    });

    if (!ruleDefinition) {
      throw new NotFoundError('Définition de règle non trouvée');
    }

    await this.ruleDefinitionRepository.remove(ruleDefinition);
  }

  /**
   * Récupérer les règles modifiables par tontine
   */
  async findModifiablesByTontine(): Promise<RuleDefinitionResponseDto[]> {
    const ruleDefinitions = await this.ruleDefinitionRepository.find({
      where: { estModifiableParTontine: true },
      order: { categorie: 'ASC', ordreAffichage: 'ASC' }
    });
    return ruleDefinitions.map((rd: RuleDefinition) => this.formatResponse(rd));
  }

  /**
   * Récupérer les règles modifiables par exercice
   */
  async findModifiablesByExercice(): Promise<RuleDefinitionResponseDto[]> {
    const ruleDefinitions = await this.ruleDefinitionRepository.find({
      where: { estModifiableParExercice: true },
      order: { categorie: 'ASC', ordreAffichage: 'ASC' }
    });
    return ruleDefinitions.map((rd: RuleDefinition) => this.formatResponse(rd));
  }

  private formatResponse(ruleDefinition: RuleDefinition): RuleDefinitionResponseDto {
    return {
      id: ruleDefinition.id,
      cle: ruleDefinition.cle,
      libelle: ruleDefinition.libelle,
      typeValeur: ruleDefinition.typeValeur,
      valeurDefaut: ruleDefinition.valeurDefaut,
      valeurMin: ruleDefinition.valeurMin,
      valeurMax: ruleDefinition.valeurMax,
      unite: ruleDefinition.unite,
      estObligatoire: ruleDefinition.estObligatoire,
      estModifiableParTontine: ruleDefinition.estModifiableParTontine,
      estModifiableParExercice: ruleDefinition.estModifiableParExercice,
      categorie: ruleDefinition.categorie,
      description: ruleDefinition.description,
      ordreAffichage: ruleDefinition.ordreAffichage,
      creeLe: ruleDefinition.creeLe
    };
  }
}

export const ruleDefinitionService = new RuleDefinitionService();
