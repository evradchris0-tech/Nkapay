/**
 * Service pour la gestion des evenements de secours
 */

import { AppDataSource } from '../../../config';
import { NotFoundError, BadRequestError } from '../../../shared';
import { EvenementSecours, StatutEvenementSecours } from '../entities/evenement-secours.entity';
import { TypeEvenementSecours } from '../entities/type-evenement-secours.entity';
import { ExerciceMembre } from '../../exercices/entities/exercice-membre.entity';
import {
  CreateEvenementSecoursDto,
  ValiderEvenementSecoursDto,
  RefuserEvenementSecoursDto,
  PayerEvenementSecoursDto,
  EvenementSecoursResponseDto,
  EvenementSecoursFiltersDto,
  SecoursSummaryDto,
} from '../dto/evenement-secours.dto';

const evenementSecoursRepository = AppDataSource.getRepository(EvenementSecours);
const typeEvenementSecoursRepository = AppDataSource.getRepository(TypeEvenementSecours);
const exerciceMembreRepository = AppDataSource.getRepository(ExerciceMembre);

export class EvenementSecoursService {
  /**
   * Declarer un evenement de secours
   */
  async create(dto: CreateEvenementSecoursDto): Promise<EvenementSecoursResponseDto> {
    // Verifier que le membre existe
    const membre = await exerciceMembreRepository.findOne({
      where: { id: dto.exerciceMembreId },
      relations: ['adhesionTontine', 'adhesionTontine.utilisateur'],
    });
    if (!membre) {
      throw new NotFoundError(`Membre d'exercice non trouve: ${dto.exerciceMembreId}`);
    }

    // Verifier que le type d'evenement existe
    const typeEvenement = await typeEvenementSecoursRepository.findOne({ where: { id: dto.typeEvenementSecoursId } });
    if (!typeEvenement) {
      throw new NotFoundError(`Type d'evenement de secours non trouve: ${dto.typeEvenementSecoursId}`);
    }

    const evenement = evenementSecoursRepository.create({
      exerciceMembreId: dto.exerciceMembreId,
      typeEvenementSecoursId: dto.typeEvenementSecoursId,
      dateEvenement: new Date(dto.dateEvenement),
      description: dto.description || null,
      montantDemande: dto.montantDemande || typeEvenement.montantParDefaut || null,
      statut: StatutEvenementSecours.DECLARE,
    });

    const saved = await evenementSecoursRepository.save(evenement);
    return this.findById(saved.id);
  }

  /**
   * Passer un evenement en cours de validation
   */
  async soumettre(id: string): Promise<EvenementSecoursResponseDto> {
    const evenement = await evenementSecoursRepository.findOne({ where: { id } });
    if (!evenement) {
      throw new NotFoundError(`Evenement de secours non trouve: ${id}`);
    }

    if (evenement.statut !== StatutEvenementSecours.DECLARE) {
      throw new BadRequestError('Seul un evenement declare peut etre soumis pour validation');
    }

    evenement.statut = StatutEvenementSecours.EN_COURS_VALIDATION;
    await evenementSecoursRepository.save(evenement);

    return this.findById(id);
  }

  /**
   * Valider un evenement de secours
   */
  async valider(id: string, dto: ValiderEvenementSecoursDto): Promise<EvenementSecoursResponseDto> {
    const evenement = await evenementSecoursRepository.findOne({ where: { id } });
    if (!evenement) {
      throw new NotFoundError(`Evenement de secours non trouve: ${id}`);
    }

    if (evenement.statut !== StatutEvenementSecours.EN_COURS_VALIDATION && evenement.statut !== StatutEvenementSecours.DECLARE) {
      throw new BadRequestError('Cet evenement ne peut pas etre valide dans son etat actuel');
    }

    evenement.statut = StatutEvenementSecours.VALIDE;
    evenement.valideParExerciceMembreId = dto.valideParExerciceMembreId;
    evenement.montantApprouve = dto.montantApprouve;
    evenement.dateValidation = new Date();

    await evenementSecoursRepository.save(evenement);
    return this.findById(id);
  }

  /**
   * Refuser un evenement de secours
   */
  async refuser(id: string, dto: RefuserEvenementSecoursDto): Promise<EvenementSecoursResponseDto> {
    const evenement = await evenementSecoursRepository.findOne({ where: { id } });
    if (!evenement) {
      throw new NotFoundError(`Evenement de secours non trouve: ${id}`);
    }

    if (evenement.statut !== StatutEvenementSecours.EN_COURS_VALIDATION && evenement.statut !== StatutEvenementSecours.DECLARE) {
      throw new BadRequestError('Cet evenement ne peut pas etre refuse dans son etat actuel');
    }

    evenement.statut = StatutEvenementSecours.REFUSE;
    evenement.valideParExerciceMembreId = dto.refuseParExerciceMembreId;
    evenement.motifRefus = dto.motifRefus;
    evenement.dateValidation = new Date();

    await evenementSecoursRepository.save(evenement);
    return this.findById(id);
  }

  /**
   * Payer un evenement de secours
   */
  async payer(id: string, dto: PayerEvenementSecoursDto): Promise<EvenementSecoursResponseDto> {
    const evenement = await evenementSecoursRepository.findOne({ where: { id } });
    if (!evenement) {
      throw new NotFoundError(`Evenement de secours non trouve: ${id}`);
    }

    if (evenement.statut !== StatutEvenementSecours.VALIDE) {
      throw new BadRequestError('Seul un evenement valide peut etre paye');
    }

    evenement.statut = StatutEvenementSecours.PAYE;
    evenement.transactionId = dto.transactionId;

    await evenementSecoursRepository.save(evenement);
    return this.findById(id);
  }

  /**
   * Lister les evenements de secours
   */
  async findAll(filters?: EvenementSecoursFiltersDto): Promise<EvenementSecoursResponseDto[]> {
    const queryBuilder = evenementSecoursRepository
      .createQueryBuilder('es')
      .leftJoinAndSelect('es.exerciceMembre', 'em')
      .leftJoinAndSelect('em.adhesionTontine', 'adhesion')
      .leftJoinAndSelect('adhesion.utilisateur', 'utilisateur')
      .leftJoinAndSelect('es.typeEvenementSecours', 'te');

    if (filters?.exerciceId) {
      queryBuilder.andWhere('em.exerciceId = :exerciceId', { exerciceId: filters.exerciceId });
    }
    if (filters?.exerciceMembreId) {
      queryBuilder.andWhere('es.exerciceMembreId = :exerciceMembreId', { exerciceMembreId: filters.exerciceMembreId });
    }
    if (filters?.typeEvenementSecoursId) {
      queryBuilder.andWhere('es.typeEvenementSecoursId = :typeEvenementSecoursId', { typeEvenementSecoursId: filters.typeEvenementSecoursId });
    }
    if (filters?.statut) {
      queryBuilder.andWhere('es.statut = :statut', { statut: filters.statut });
    }
    if (filters?.dateDebut) {
      queryBuilder.andWhere('es.dateEvenement >= :dateDebut', { dateDebut: filters.dateDebut });
    }
    if (filters?.dateFin) {
      queryBuilder.andWhere('es.dateEvenement <= :dateFin', { dateFin: filters.dateFin });
    }

    const evenements = await queryBuilder
      .orderBy('es.dateDeclaration', 'DESC')
      .getMany();

    return evenements.map((e) => this.toResponseDto(e));
  }

  /**
   * Trouver un evenement de secours par ID
   */
  async findById(id: string): Promise<EvenementSecoursResponseDto> {
    const evenement = await evenementSecoursRepository.findOne({
      where: { id },
      relations: ['exerciceMembre', 'exerciceMembre.adhesionTontine', 'exerciceMembre.adhesionTontine.utilisateur', 'typeEvenementSecours'],
    });

    if (!evenement) {
      throw new NotFoundError(`Evenement de secours non trouve: ${id}`);
    }

    return this.toResponseDto(evenement);
  }

  /**
   * Obtenir le resume des secours
   */
  async getSummary(filters?: EvenementSecoursFiltersDto): Promise<SecoursSummaryDto> {
    const evenements = await this.findAll(filters);

    const totalEvenements = evenements.length;
    const totalMontantDemande = evenements.reduce((sum, e) => sum + Number(e.montantDemande || 0), 0);
    const totalMontantApprouve = evenements.reduce((sum, e) => sum + Number(e.montantApprouve || 0), 0);
    const evenementsPaues = evenements.filter((e) => e.statut === StatutEvenementSecours.PAYE);
    const totalMontantPaye = evenementsPaues.reduce((sum, e) => sum + Number(e.montantApprouve || 0), 0);

    return {
      totalEvenements,
      totalMontantDemande,
      totalMontantApprouve,
      totalMontantPaye,
      evenementsEnAttente: evenements.filter((e) => e.statut === StatutEvenementSecours.DECLARE || e.statut === StatutEvenementSecours.EN_COURS_VALIDATION).length,
      evenementsValides: evenements.filter((e) => e.statut === StatutEvenementSecours.VALIDE).length,
      evenementsPaues: evenementsPaues.length,
      evenementsRefuses: evenements.filter((e) => e.statut === StatutEvenementSecours.REFUSE).length,
    };
  }

  /**
   * Transformer en DTO de reponse
   */
  private toResponseDto(entity: EvenementSecours): EvenementSecoursResponseDto {
    const utilisateur = entity.exerciceMembre?.adhesionTontine?.utilisateur;
    
    return {
      id: entity.id,
      exerciceMembreId: entity.exerciceMembreId,
      exerciceMembre: entity.exerciceMembre ? {
        id: entity.exerciceMembre.id,
        utilisateurId: utilisateur?.id || '',
        utilisateurNom: utilisateur ? `${utilisateur.prenom} ${utilisateur.nom}` : undefined,
      } : undefined,
      typeEvenementSecoursId: entity.typeEvenementSecoursId,
      typeEvenementSecours: entity.typeEvenementSecours ? {
        id: entity.typeEvenementSecours.id,
        code: entity.typeEvenementSecours.code,
        libelle: entity.typeEvenementSecours.libelle,
        montantParDefaut: entity.typeEvenementSecours.montantParDefaut ? Number(entity.typeEvenementSecours.montantParDefaut) : undefined,
      } : undefined,
      dateEvenement: entity.dateEvenement.toISOString().split('T')[0],
      description: entity.description,
      montantDemande: entity.montantDemande ? Number(entity.montantDemande) : null,
      montantApprouve: entity.montantApprouve ? Number(entity.montantApprouve) : null,
      statut: entity.statut,
      dateDeclaration: entity.dateDeclaration,
      dateValidation: entity.dateValidation,
      valideParExerciceMembreId: entity.valideParExerciceMembreId,
      transactionId: entity.transactionId,
      motifRefus: entity.motifRefus,
    };
  }
}

export const evenementSecoursService = new EvenementSecoursService();
