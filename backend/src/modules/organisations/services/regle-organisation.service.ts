import { Repository } from 'typeorm';
import { AppDataSource } from '../../../config';
import { NotFoundError, BadRequestError } from '../../../shared';
import { RegleOrganisation } from '../entities/regle-organisation.entity';
import { RuleDefinition } from '../../tontines/entities/rule-definition.entity';
import { SetRegleOrganisationDto, RegleOrganisationResponseDto } from '../dto/organisation.dto';

export class RegleOrganisationService {
  private _regleRepo?: Repository<RegleOrganisation>;
  private _ruleDefRepo?: Repository<RuleDefinition>;

  private get regleRepo(): Repository<RegleOrganisation> {
    if (!this._regleRepo) this._regleRepo = AppDataSource.getRepository(RegleOrganisation);
    return this._regleRepo;
  }

  private get ruleDefRepo(): Repository<RuleDefinition> {
    if (!this._ruleDefRepo) this._ruleDefRepo = AppDataSource.getRepository(RuleDefinition);
    return this._ruleDefRepo;
  }

  /**
   * Récupère toutes les règles actives d'une organisation
   */
  async findByOrganisation(organisationId: string): Promise<RegleOrganisationResponseDto[]> {
    const regles = await this.regleRepo.find({
      where: { organisationId, estActive: true },
      relations: ['ruleDefinition'],
      order: { creeLe: 'ASC' },
    });
    return regles.map((r) => this.toResponseDto(r));
  }

  /**
   * Définit ou met à jour une règle pour une organisation (upsert)
   */
  async set(
    organisationId: string,
    dto: SetRegleOrganisationDto,
    membreOrganisationId?: string
  ): Promise<RegleOrganisationResponseDto> {
    // Vérifier que la rule definition existe et est modifiable par l'organisation
    const ruleDef = await this.ruleDefRepo.findOne({
      where: { id: dto.ruleDefinitionId },
    });
    if (!ruleDef) throw new NotFoundError(`Règle introuvable: ${dto.ruleDefinitionId}`);
    if (!ruleDef.estModifiableParOrganisation) {
      throw new BadRequestError(`La règle "${ruleDef.cle}" n'est pas modifiable par l'organisation`);
    }

    // Upsert : créer ou mettre à jour
    let regle = await this.regleRepo.findOne({
      where: { organisationId, ruleDefinitionId: dto.ruleDefinitionId },
    });

    if (regle) {
      regle.valeur = dto.valeur;
      regle.estActive = true;
      if (membreOrganisationId) regle.modifieParMembreOrganisationId = membreOrganisationId;
    } else {
      regle = this.regleRepo.create({
        organisationId,
        ruleDefinitionId: dto.ruleDefinitionId,
        valeur: dto.valeur,
        estActive: true,
        modifieParMembreOrganisationId: membreOrganisationId ?? null,
      });
    }

    const saved = await this.regleRepo.save(regle);
    const full = await this.regleRepo.findOne({
      where: { id: saved.id },
      relations: ['ruleDefinition'],
    });
    return this.toResponseDto(full!);
  }

  /**
   * Désactive une règle organisation (retour au défaut global)
   */
  async reset(organisationId: string, ruleDefinitionId: string): Promise<void> {
    await this.regleRepo.update(
      { organisationId, ruleDefinitionId },
      { estActive: false }
    );
  }

  /**
   * Résout la valeur d'une règle pour une organisation (niveau org seulement)
   * Retourne null si aucune règle org active n'existe
   */
  async getEffectiveValueByCle(organisationId: string, cle: string): Promise<string | null> {
    const result = await this.regleRepo
      .createQueryBuilder('ro')
      .innerJoin('ro.ruleDefinition', 'rd')
      .where('ro.organisation_id = :organisationId', { organisationId })
      .andWhere('rd.cle = :cle', { cle })
      .andWhere('ro.est_active = true')
      .select('ro.valeur')
      .getOne();

    return result?.valeur ?? null;
  }

  /**
   * Auto-seed les règles org à partir des définitions globales lors de l'onboarding
   * N'écrase pas les règles existantes
   */
  async seedDefaultsForOrganisation(organisationId: string): Promise<void> {
    const allDefs = await this.ruleDefRepo.find({
      where: { estModifiableParOrganisation: true },
    });

    for (const def of allDefs) {
      if (!def.valeurDefaut) continue;
      const existing = await this.regleRepo.findOne({
        where: { organisationId, ruleDefinitionId: def.id },
      });
      if (!existing) {
        await this.regleRepo.save(
          this.regleRepo.create({
            organisationId,
            ruleDefinitionId: def.id,
            valeur: def.valeurDefaut,
            estActive: true,
          })
        );
      }
    }
  }

  private toResponseDto(r: RegleOrganisation): RegleOrganisationResponseDto {
    return {
      id: r.id,
      ruleDefinitionId: r.ruleDefinitionId,
      cle: r.ruleDefinition?.cle ?? '',
      libelle: r.ruleDefinition?.libelle ?? '',
      typeValeur: r.ruleDefinition?.typeValeur ?? '',
      valeur: r.valeur,
      estActive: r.estActive,
      modifieLe: r.modifieLe,
    };
  }
}

export const regleOrganisationService = new RegleOrganisationService();
