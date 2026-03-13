/**
 * Service pour la gestion des prets
 */

import { Repository } from 'typeorm';
import { AppDataSource } from '../../../config';
import { NotFoundError, BadRequestError, PaginationQuery, PaginatedResult } from '../../../shared';
import { Pret, StatutPret } from '../entities/pret.entity';
import { ExerciceMembre } from '../../exercices/entities/exercice-membre.entity';
import { Reunion } from '../../reunions/entities/reunion.entity';
import {
  CreatePretDto,
  ApprouverPretDto,
  RefuserPretDto,
  DecaisserPretDto,
  PretResponseDto,
  PretFiltersDto,
  PretsSummaryDto,
} from '../dto/pret.dto';

import { regleExerciceService } from '../../exercices/services/regle-exercice.service';
import { StateMachine } from '../../../shared/utils/state-machine.util';
import { PretBuilder } from '../builders/pret.builder';

// =============================================================================
// Machine à États (Design Pattern: State)
// =============================================================================

const pretStateMachine = new StateMachine<StatutPret>(
  [
    { from: StatutPret.DEMANDE, to: StatutPret.APPROUVE, action: 'approuver' },
    { from: StatutPret.DEMANDE, to: StatutPret.REFUSE, action: 'refuser' },
    { from: StatutPret.APPROUVE, to: StatutPret.DECAISSE, action: 'decaisser' },
    { from: StatutPret.DECAISSE, to: StatutPret.EN_COURS, action: 'activer' },
    { from: StatutPret.EN_COURS, to: StatutPret.SOLDE, action: 'solder' },
    { from: StatutPret.EN_COURS, to: StatutPret.DEFAUT, action: 'mettre en defaut' },
  ],
  'Prêt'
);

export class PretService {
  private _pretRepo?: Repository<Pret>;
  private _exerciceMembreRepo?: Repository<ExerciceMembre>;
  private _reunionRepo?: Repository<Reunion>;

  private get pretRepository(): Repository<Pret> {
    if (!this._pretRepo) this._pretRepo = AppDataSource.getRepository(Pret);
    return this._pretRepo;
  }

  private get exerciceMembreRepository(): Repository<ExerciceMembre> {
    if (!this._exerciceMembreRepo)
      this._exerciceMembreRepo = AppDataSource.getRepository(ExerciceMembre);
    return this._exerciceMembreRepo;
  }

  private get reunionRepository(): Repository<Reunion> {
    if (!this._reunionRepo) this._reunionRepo = AppDataSource.getRepository(Reunion);
    return this._reunionRepo;
  }

  // ... getters existing ...

  /**
   * Demander un pret (Design Pattern: Builder)
   */
  async create(dto: CreatePretDto): Promise<PretResponseDto> {
    // Verifier le membre
    const membre = await this.exerciceMembreRepository.findOne({
      where: { id: dto.exerciceMembreId },
    });
    if (!membre) {
      throw new NotFoundError(`Membre d'exercice non trouve: ${dto.exerciceMembreId}`);
    }

    // Verifier la reunion
    const reunion = await this.reunionRepository.findOne({ where: { id: dto.reunionId } });
    if (!reunion) {
      throw new NotFoundError(`Reunion non trouvee: ${dto.reunionId}`);
    }

    // 1. Récupérer le taux d'intérêt effectif (règle 'PRET_TAUX_INTERET')
    let tauxInteret = dto.tauxInteret;
    if (tauxInteret === undefined) {
      const ruleValue = await regleExerciceService.getEffectiveValueByCle(
        membre.exerciceId,
        'PRET_TAUX_INTERET'
      );
      if (ruleValue) {
        tauxInteret = parseFloat(ruleValue);
      } else {
        tauxInteret = 0.05;
      }
    }

    // 2. Valider la durée max (règle 'PRET_DUREE_MAX')
    const maxDureeValue = await regleExerciceService.getEffectiveValueByCle(
      membre.exerciceId,
      'PRET_DUREE_MAX'
    );
    if (maxDureeValue) {
      const maxDuree = parseInt(maxDureeValue, 10);
      if (dto.dureeMois > maxDuree) {
        throw new BadRequestError(
          `La durée du prêt (${dto.dureeMois} mois) dépasse la durée maximale autorisée (${maxDuree} mois).`
        );
      }
    }

    // 3. Valider le plafond (règle 'PRET_PLAFOND_MONTANT')
    const plafondValue = await regleExerciceService.getEffectiveValueByCle(
      membre.exerciceId,
      'PRET_PLAFOND_MONTANT'
    );
    if (plafondValue) {
      const plafond = parseFloat(plafondValue);
      if (dto.montantCapital > plafond) {
        throw new BadRequestError(
          `Le montant demandé (${dto.montantCapital}) dépasse le plafond autorisé (${plafond}).`
        );
      }
    }

    // Construction via Builder (calcul automatique des intérêts)
    const pretData = new PretBuilder()
      .forMembre(dto.exerciceMembreId)
      .atReunion(dto.reunionId)
      .withCapital(dto.montantCapital)
      .withTaux(tauxInteret)
      .withDuree(dto.dureeMois);

    if (dto.commentaire) pretData.withCommentaire(dto.commentaire);

    const pret = this.pretRepository.create(pretData.build() as Partial<Pret>);

    const saved = await this.pretRepository.save(pret);
    return this.findById(saved.id);
  }

  /**
   * Approuver un pret
   */
  async approuver(id: string, dto: ApprouverPretDto): Promise<PretResponseDto> {
    const pret = await this.pretRepository.findOne({ where: { id } });
    if (!pret) {
      throw new NotFoundError(`Pret non trouve: ${id}`);
    }

    pretStateMachine.assertTransition(pret.statut, StatutPret.APPROUVE);

    // Mettre a jour le taux et la duree si fournis
    if (dto.tauxInteret !== undefined) {
      pret.tauxInteret = dto.tauxInteret;
    }
    if (dto.dureeMois !== undefined) {
      pret.dureeMois = dto.dureeMois;
    }

    // Recalculer les interets
    pret.montantInteret = (Number(pret.montantCapital) * pret.tauxInteret * pret.dureeMois) / 12;
    pret.montantTotalDu = Number(pret.montantCapital) + pret.montantInteret;

    pret.statut = StatutPret.APPROUVE;
    pret.dateApprobation = new Date();
    pret.approuveParExerciceMembreId = dto.approuveParExerciceMembreId;

    await this.pretRepository.save(pret);
    return this.findById(id);
  }

  /**
   * Refuser un pret
   */
  async refuser(id: string, dto: RefuserPretDto): Promise<PretResponseDto> {
    const pret = await this.pretRepository.findOne({ where: { id } });
    if (!pret) {
      throw new NotFoundError(`Pret non trouve: ${id}`);
    }

    pretStateMachine.assertTransition(pret.statut, StatutPret.REFUSE);

    pret.statut = StatutPret.REFUSE;
    pret.motifRefus = dto.motifRefus;

    await this.pretRepository.save(pret);
    return this.findById(id);
  }

  /**
   * Decaisser un pret
   */
  async decaisser(id: string, dto: DecaisserPretDto): Promise<PretResponseDto> {
    const pret = await this.pretRepository.findOne({ where: { id } });
    if (!pret) {
      throw new NotFoundError(`Pret non trouve: ${id}`);
    }

    pretStateMachine.assertTransition(pret.statut, StatutPret.DECAISSE);

    const dateDecaissement = dto.dateDecaissement ? new Date(dto.dateDecaissement) : new Date();

    // Calculer la date d'echeance
    const dateEcheance = new Date(dateDecaissement);
    dateEcheance.setMonth(dateEcheance.getMonth() + pret.dureeMois);

    pret.statut = StatutPret.DECAISSE;
    pret.dateDecaissement = dateDecaissement;
    pret.dateEcheance = dateEcheance;

    await this.pretRepository.save(pret);

    // Mettre en cours automatiquement apres decaissement
    pretStateMachine.assertTransition(pret.statut, StatutPret.EN_COURS);
    pret.statut = StatutPret.EN_COURS;
    await this.pretRepository.save(pret);

    return this.findById(id);
  }

  /**
   * Marquer un pret comme solde
   */
  async solder(id: string): Promise<PretResponseDto> {
    const pret = await this.pretRepository.findOne({ where: { id } });
    if (!pret) {
      throw new NotFoundError(`Pret non trouve: ${id}`);
    }

    pretStateMachine.assertTransition(pret.statut, StatutPret.SOLDE);

    if (Number(pret.capitalRestant) > 0.01) {
      throw new BadRequestError('Le capital restant doit etre zero pour solder le pret');
    }

    pret.statut = StatutPret.SOLDE;
    pret.dateSolde = new Date();
    pret.capitalRestant = 0;

    await this.pretRepository.save(pret);
    return this.findById(id);
  }

  /**
   * Marquer un pret en defaut
   */
  async mettreEnDefaut(id: string): Promise<PretResponseDto> {
    const pret = await this.pretRepository.findOne({ where: { id } });
    if (!pret) {
      throw new NotFoundError(`Pret non trouve: ${id}`);
    }

    pretStateMachine.assertTransition(pret.statut, StatutPret.DEFAUT);

    pret.statut = StatutPret.DEFAUT;

    await this.pretRepository.save(pret);
    return this.findById(id);
  }

  /**
   * Lister les prets avec pagination
   */
  async findAll(
    filters?: PretFiltersDto,
    pagination?: PaginationQuery
  ): Promise<PaginatedResult<PretResponseDto>> {
    const page = pagination?.page ?? 1;
    const limit = Math.min(pagination?.limit ?? 20, 100);

    const queryBuilder = this.pretRepository
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.exerciceMembre', 'em')
      .leftJoinAndSelect('em.adhesionTontine', 'adhesion')
      .leftJoinAndSelect('adhesion.utilisateur', 'utilisateur')
      .leftJoin('p.remboursements', 'remboursements')
      .addSelect('COUNT(remboursements.id)', 'nombreRemboursements')
      .addSelect('COALESCE(SUM(remboursements.montantTotal), 0)', 'montantTotalRembourse')
      .groupBy('p.id')
      .addGroupBy('em.id')
      .addGroupBy('adhesion.id')
      .addGroupBy('utilisateur.id');

    if (filters?.exerciceId) {
      queryBuilder.andWhere('em.exerciceId = :exerciceId', { exerciceId: filters.exerciceId });
    }
    if (filters?.exerciceMembreId) {
      queryBuilder.andWhere('p.exerciceMembreId = :exerciceMembreId', {
        exerciceMembreId: filters.exerciceMembreId,
      });
    }
    if (filters?.statut) {
      queryBuilder.andWhere('p.statut = :statut', { statut: filters.statut });
    }
    if (filters?.dateDebut) {
      queryBuilder.andWhere('p.dateDemande >= :dateDebut', { dateDebut: filters.dateDebut });
    }
    if (filters?.dateFin) {
      queryBuilder.andWhere('p.dateDemande <= :dateFin', { dateFin: filters.dateFin });
    }

    // Compter le total avant pagination
    const total = await queryBuilder.getCount();

    queryBuilder
      .orderBy('p.dateDemande', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const results = await queryBuilder.getRawAndEntities();

    const prets = results.entities.map((pret, index) => {
      const raw = results.raw[index];
      return this.toResponseDto(pret, {
        nombreRemboursements: parseInt(raw.nombreRemboursements) || 0,
        montantTotalRembourse: parseFloat(raw.montantTotalRembourse) || 0,
      });
    });

    return {
      data: prets,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Trouver un pret par ID
   */
  async findById(id: string): Promise<PretResponseDto> {
    const pret = await this.pretRepository.findOne({
      where: { id },
      relations: [
        'exerciceMembre',
        'exerciceMembre.adhesionTontine',
        'exerciceMembre.adhesionTontine.utilisateur',
        'remboursements',
      ],
    });

    if (!pret) {
      throw new NotFoundError(`Pret non trouve: ${id}`);
    }

    const nombreRemboursements = pret.remboursements?.length || 0;
    const montantTotalRembourse =
      pret.remboursements?.reduce((sum, r) => sum + Number(r.montantTotal), 0) || 0;

    return this.toResponseDto(pret, { nombreRemboursements, montantTotalRembourse });
  }

  /**
   * Obtenir le resume des prets
   */
  async getSummary(filters?: PretFiltersDto): Promise<PretsSummaryDto> {
    const { data: prets } = await this.findAll(filters, { limit: 1000 });

    let totalCapitalPrete = 0;
    let totalCapitalRestant = 0;
    let totalInterets = 0;
    let pretsEnCours = 0;
    let pretsSoldes = 0;
    let pretsEnDefaut = 0;

    for (const pret of prets) {
      totalCapitalPrete += pret.montantCapital;
      totalCapitalRestant += pret.capitalRestant;
      totalInterets += pret.montantInteret;

      if (pret.statut === StatutPret.EN_COURS || pret.statut === StatutPret.DECAISSE) {
        pretsEnCours++;
      } else if (pret.statut === StatutPret.SOLDE) {
        pretsSoldes++;
      } else if (pret.statut === StatutPret.DEFAUT) {
        pretsEnDefaut++;
      }
    }

    return {
      totalPrets: prets.length,
      totalCapitalPrete,
      totalCapitalRestant,
      totalInterets,
      pretsEnCours,
      pretsSoldes,
      pretsEnDefaut,
    };
  }

  /**
   * Transformer en DTO de reponse
   */
  private toResponseDto(
    entity: Pret,
    extras?: { nombreRemboursements: number; montantTotalRembourse: number }
  ): PretResponseDto {
    const utilisateur = entity.exerciceMembre?.adhesionTontine?.utilisateur;

    return {
      id: entity.id,
      reunionId: entity.reunionId,
      exerciceMembreId: entity.exerciceMembreId,
      exerciceMembre: entity.exerciceMembre
        ? {
            id: entity.exerciceMembre.id,
            utilisateurId: utilisateur?.id || '',
            utilisateurNom: utilisateur ? `${utilisateur.prenom} ${utilisateur.nom}` : undefined,
          }
        : undefined,
      montantCapital: Number(entity.montantCapital),
      tauxInteret: Number(entity.tauxInteret),
      montantInteret: Number(entity.montantInteret),
      montantTotalDu: Number(entity.montantTotalDu),
      dureeMois: entity.dureeMois,
      statut: entity.statut,
      capitalRestant: Number(entity.capitalRestant),
      dateDemande: entity.dateDemande,
      dateApprobation: entity.dateApprobation,
      dateDecaissement: entity.dateDecaissement,
      dateEcheance: entity.dateEcheance,
      dateSolde: entity.dateSolde,
      approuveParExerciceMembreId: entity.approuveParExerciceMembreId,
      motifRefus: entity.motifRefus,
      commentaire: entity.commentaire,
      nombreRemboursements: extras?.nombreRemboursements,
      montantTotalRembourse: extras?.montantTotalRembourse,
    };
  }
}

export const pretService = new PretService();
