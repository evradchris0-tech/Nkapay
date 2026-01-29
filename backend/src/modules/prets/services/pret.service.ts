/**
 * Service pour la gestion des prets
 */

import { AppDataSource } from '../../../config';
import { NotFoundError, BadRequestError } from '../../../shared';
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

const pretRepository = AppDataSource.getRepository(Pret);
const exerciceMembreRepository = AppDataSource.getRepository(ExerciceMembre);
const reunionRepository = AppDataSource.getRepository(Reunion);

export class PretService {
  /**
   * Demander un pret
   */
  async create(dto: CreatePretDto): Promise<PretResponseDto> {
    // Verifier le membre
    const membre = await exerciceMembreRepository.findOne({ where: { id: dto.exerciceMembreId } });
    if (!membre) {
      throw new NotFoundError(`Membre d'exercice non trouve: ${dto.exerciceMembreId}`);
    }

    // Verifier la reunion
    const reunion = await reunionRepository.findOne({ where: { id: dto.reunionId } });
    if (!reunion) {
      throw new NotFoundError(`Reunion non trouvee: ${dto.reunionId}`);
    }

    // Calculer les interets
    const tauxInteret = dto.tauxInteret || 0;
    const montantInteret = dto.montantCapital * tauxInteret * dto.dureeMois / 12;
    const montantTotalDu = dto.montantCapital + montantInteret;

    const pret = pretRepository.create({
      reunionId: dto.reunionId,
      exerciceMembreId: dto.exerciceMembreId,
      montantCapital: dto.montantCapital,
      tauxInteret,
      montantInteret,
      montantTotalDu,
      dureeMois: dto.dureeMois,
      capitalRestant: dto.montantCapital,
      statut: StatutPret.DEMANDE,
      commentaire: dto.commentaire || null,
    });

    const saved = await pretRepository.save(pret);
    return this.findById(saved.id);
  }

  /**
   * Approuver un pret
   */
  async approuver(id: string, dto: ApprouverPretDto): Promise<PretResponseDto> {
    const pret = await pretRepository.findOne({ where: { id } });
    if (!pret) {
      throw new NotFoundError(`Pret non trouve: ${id}`);
    }

    if (pret.statut !== StatutPret.DEMANDE) {
      throw new BadRequestError('Seul un pret en demande peut etre approuve');
    }

    // Mettre a jour le taux et la duree si fournis
    if (dto.tauxInteret !== undefined) {
      pret.tauxInteret = dto.tauxInteret;
    }
    if (dto.dureeMois !== undefined) {
      pret.dureeMois = dto.dureeMois;
    }

    // Recalculer les interets
    pret.montantInteret = Number(pret.montantCapital) * pret.tauxInteret * pret.dureeMois / 12;
    pret.montantTotalDu = Number(pret.montantCapital) + pret.montantInteret;

    pret.statut = StatutPret.APPROUVE;
    pret.dateApprobation = new Date();
    pret.approuveParExerciceMembreId = dto.approuveParExerciceMembreId;

    await pretRepository.save(pret);
    return this.findById(id);
  }

  /**
   * Refuser un pret
   */
  async refuser(id: string, dto: RefuserPretDto): Promise<PretResponseDto> {
    const pret = await pretRepository.findOne({ where: { id } });
    if (!pret) {
      throw new NotFoundError(`Pret non trouve: ${id}`);
    }

    if (pret.statut !== StatutPret.DEMANDE) {
      throw new BadRequestError('Seul un pret en demande peut etre refuse');
    }

    pret.statut = StatutPret.REFUSE;
    pret.motifRefus = dto.motifRefus;

    await pretRepository.save(pret);
    return this.findById(id);
  }

  /**
   * Decaisser un pret
   */
  async decaisser(id: string, dto: DecaisserPretDto): Promise<PretResponseDto> {
    const pret = await pretRepository.findOne({ where: { id } });
    if (!pret) {
      throw new NotFoundError(`Pret non trouve: ${id}`);
    }

    if (pret.statut !== StatutPret.APPROUVE) {
      throw new BadRequestError('Seul un pret approuve peut etre decaisse');
    }

    const dateDecaissement = dto.dateDecaissement ? new Date(dto.dateDecaissement) : new Date();

    // Calculer la date d'echeance
    const dateEcheance = new Date(dateDecaissement);
    dateEcheance.setMonth(dateEcheance.getMonth() + pret.dureeMois);

    pret.statut = StatutPret.DECAISSE;
    pret.dateDecaissement = dateDecaissement;
    pret.dateEcheance = dateEcheance;

    await pretRepository.save(pret);

    // Mettre en cours automatiquement apres decaissement
    pret.statut = StatutPret.EN_COURS;
    await pretRepository.save(pret);

    return this.findById(id);
  }

  /**
   * Marquer un pret comme solde
   */
  async solder(id: string): Promise<PretResponseDto> {
    const pret = await pretRepository.findOne({ where: { id } });
    if (!pret) {
      throw new NotFoundError(`Pret non trouve: ${id}`);
    }

    if (pret.statut !== StatutPret.EN_COURS) {
      throw new BadRequestError('Seul un pret en cours peut etre solde');
    }

    if (Number(pret.capitalRestant) > 0.01) {
      throw new BadRequestError('Le capital restant doit etre zero pour solder le pret');
    }

    pret.statut = StatutPret.SOLDE;
    pret.dateSolde = new Date();
    pret.capitalRestant = 0;

    await pretRepository.save(pret);
    return this.findById(id);
  }

  /**
   * Marquer un pret en defaut
   */
  async mettreEnDefaut(id: string): Promise<PretResponseDto> {
    const pret = await pretRepository.findOne({ where: { id } });
    if (!pret) {
      throw new NotFoundError(`Pret non trouve: ${id}`);
    }

    if (pret.statut !== StatutPret.EN_COURS) {
      throw new BadRequestError('Seul un pret en cours peut etre mis en defaut');
    }

    pret.statut = StatutPret.DEFAUT;

    await pretRepository.save(pret);
    return this.findById(id);
  }

  /**
   * Lister les prets
   */
  async findAll(filters?: PretFiltersDto): Promise<{ prets: PretResponseDto[]; total: number }> {
    const queryBuilder = pretRepository
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
      queryBuilder.andWhere('p.exerciceMembreId = :exerciceMembreId', { exerciceMembreId: filters.exerciceMembreId });
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

    const results = await queryBuilder
      .orderBy('p.dateDemande', 'DESC')
      .getRawAndEntities();

    const prets = results.entities.map((pret, index) => {
      const raw = results.raw[index];
      return this.toResponseDto(pret, {
        nombreRemboursements: parseInt(raw.nombreRemboursements) || 0,
        montantTotalRembourse: parseFloat(raw.montantTotalRembourse) || 0,
      });
    });

    return {
      prets,
      total: prets.length,
    };
  }

  /**
   * Trouver un pret par ID
   */
  async findById(id: string): Promise<PretResponseDto> {
    const pret = await pretRepository.findOne({
      where: { id },
      relations: ['exerciceMembre', 'exerciceMembre.adhesionTontine', 'exerciceMembre.adhesionTontine.utilisateur', 'remboursements'],
    });

    if (!pret) {
      throw new NotFoundError(`Pret non trouve: ${id}`);
    }

    const nombreRemboursements = pret.remboursements?.length || 0;
    const montantTotalRembourse = pret.remboursements?.reduce((sum, r) => sum + Number(r.montantTotal), 0) || 0;

    return this.toResponseDto(pret, { nombreRemboursements, montantTotalRembourse });
  }

  /**
   * Obtenir le resume des prets
   */
  async getSummary(filters?: PretFiltersDto): Promise<PretsSummaryDto> {
    const { prets } = await this.findAll(filters);

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
      exerciceMembre: entity.exerciceMembre ? {
        id: entity.exerciceMembre.id,
        utilisateurId: utilisateur?.id || '',
        utilisateurNom: utilisateur ? `${utilisateur.prenom} ${utilisateur.nom}` : undefined,
      } : undefined,
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
