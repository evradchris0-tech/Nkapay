/**
 * Service pour la gestion des épargnes dues mensuelles
 * 
 * LOGIQUE MÉTIER:
 * - L'épargne est un montant mis de côté INDIVIDUELLEMENT par chaque membre
 * - Contrairement à la cotisation (redistribuée), l'épargne est CONSERVÉE
 * - À la fin de l'exercice (CASSATION), chaque membre récupère SON épargne
 */

import { Repository } from 'typeorm';
import { AppDataSource } from '../../../config';
import { NotFoundError, BadRequestError } from '../../../shared';
import { EpargneDueMensuelle } from '../entities/epargne-due-mensuelle.entity';
import { StatutDu } from '../entities/inscription-due-exercice.entity';
import { Reunion } from '../../reunions/entities/reunion.entity';
import { ExerciceMembre } from '../../exercices/entities/exercice-membre.entity';
import {
    DueFiltersDto,
    UpdateDuePaymentDto
} from '../dto/dues.dto';

/** DTO de réponse pour les épargnes dues */
export interface EpargneDueResponseDto {
    id: string;
    reunionId: string;
    exerciceMembreId: string;
    montantDu: number;
    montantPaye: number;
    soldeRestant: number;
    statut: StatutDu;
    creeLe: Date;
}

export class EpargneDueService {
    private _epargneDueRepo?: Repository<EpargneDueMensuelle>;
    private _reunionRepo?: Repository<Reunion>;
    private _exerciceMembreRepo?: Repository<ExerciceMembre>;

    private get epargneDueRepository(): Repository<EpargneDueMensuelle> {
        if (!this._epargneDueRepo) this._epargneDueRepo = AppDataSource.getRepository(EpargneDueMensuelle);
        return this._epargneDueRepo;
    }

    private get reunionRepository(): Repository<Reunion> {
        if (!this._reunionRepo) this._reunionRepo = AppDataSource.getRepository(Reunion);
        return this._reunionRepo;
    }

    private get exerciceMembreRepository(): Repository<ExerciceMembre> {
        if (!this._exerciceMembreRepo) this._exerciceMembreRepo = AppDataSource.getRepository(ExerciceMembre);
        return this._exerciceMembreRepo;
    }

    /**
     * Générer les épargnes dues pour une réunion
     */
    async genererPourReunion(reunionId: string, montantDu: number): Promise<EpargneDueResponseDto[]> {
        const reunion = await this.reunionRepository.findOne({
            where: { id: reunionId },
            relations: ['exercice', 'exercice.membres']
        });

        if (!reunion) {
            throw new NotFoundError('Réunion non trouvée');
        }

        const epargnesDues: EpargneDueResponseDto[] = [];

        for (const exerciceMembre of reunion.exercice.membres) {
            const existing = await this.epargneDueRepository.findOne({
                where: {
                    reunionId,
                    exerciceMembreId: exerciceMembre.id
                }
            });

            if (!existing) {
                const epargneDue = this.epargneDueRepository.create({
                    reunionId,
                    exerciceMembreId: exerciceMembre.id,
                    montantDu,
                    montantPaye: 0,
                    soldeRestant: montantDu,
                    statut: StatutDu.EN_RETARD
                });
                await this.epargneDueRepository.save(epargneDue);
                epargnesDues.push(this.formatResponse(epargneDue));
            }
        }

        return epargnesDues;
    }

    /**
     * Récupérer les épargnes dues d'une réunion
     */
    async findByReunion(reunionId: string): Promise<EpargneDueResponseDto[]> {
        const epargnes = await this.epargneDueRepository.find({
            where: { reunionId },
            relations: ['reunion', 'exerciceMembre', 'exerciceMembre.adhesionTontine'],
            order: { creeLe: 'ASC' }
        });
        return epargnes.map((e: EpargneDueMensuelle) => this.formatResponse(e));
    }

    /**
     * Récupérer une épargne due par ID
     */
    async findById(id: string): Promise<EpargneDueResponseDto> {
        const epargneDue = await this.epargneDueRepository.findOne({
            where: { id },
            relations: ['reunion', 'exerciceMembre', 'exerciceMembre.adhesionTontine']
        });

        if (!epargneDue) {
            throw new NotFoundError('Épargne due non trouvée');
        }

        return this.formatResponse(epargneDue);
    }

    /**
     * Enregistrer un paiement par contexte (Réunion + Membre)
     * Utile pour les transactions validées de type EPARGNE
     */
    async payerParContexte(reunionId: string, exerciceMembreId: string, montant: number, transactionalEntityManager?: any): Promise<EpargneDueResponseDto | null> {
        const repository = transactionalEntityManager
            ? transactionalEntityManager.getRepository(EpargneDueMensuelle)
            : this.epargneDueRepository;

        const epargneDue = await repository.findOne({
            where: { reunionId, exerciceMembreId }
        });

        if (!epargneDue) {
            return null;
        }

        return this.payer(epargneDue.id, { montantPaye: montant }, transactionalEntityManager);
    }

    /**
     * Enregistrer un paiement d'épargne
     */
    async payer(id: string, data: UpdateDuePaymentDto, transactionalEntityManager?: any): Promise<EpargneDueResponseDto> {
        const repository = transactionalEntityManager
            ? transactionalEntityManager.getRepository(EpargneDueMensuelle)
            : this.epargneDueRepository;

        const epargneDue = await repository.findOne({
            where: { id }
        });

        if (!epargneDue) {
            throw new NotFoundError('Épargne due non trouvée');
        }

        if (data.montantPaye <= 0) {
            throw new BadRequestError('Le montant doit être positif');
        }

        epargneDue.montantPaye = Number(epargneDue.montantPaye) + data.montantPaye;
        epargneDue.soldeRestant = Number(epargneDue.montantDu) - epargneDue.montantPaye;

        // Mise à jour du statut
        if (epargneDue.soldeRestant <= 0) {
            epargneDue.statut = epargneDue.soldeRestant < 0 ? StatutDu.SURPAYE : StatutDu.A_JOUR;
            epargneDue.soldeRestant = Math.max(0, epargneDue.soldeRestant);
        }

        await repository.save(epargneDue);
        return this.findById(id);
    }

    /**
     * Calculer l'épargne totale accumulée par un membre sur tout l'exercice
     * Utile pour la CASSATION
     */
    async getEpargneTotaleMembre(exerciceMembreId: string): Promise<number> {
        const result = await this.epargneDueRepository
            .createQueryBuilder('epargne')
            .select('SUM(epargne.montantPaye)', 'total')
            .where('epargne.exerciceMembreId = :exerciceMembreId', { exerciceMembreId })
            .getRawOne();

        return Number(result?.total) || 0;
    }

    /**
     * Statistiques des épargnes d'une réunion
     */
    async getStatsByReunion(reunionId: string): Promise<{
        total: number;
        totalMontantDu: number;
        totalMontantPaye: number;
        tauxRecouvrement: number;
        aJour: number;
        enRetard: number;
    }> {
        const epargnes = await this.epargneDueRepository.find({
            where: { reunionId }
        });

        const stats = {
            total: epargnes.length,
            totalMontantDu: 0,
            totalMontantPaye: 0,
            tauxRecouvrement: 0,
            aJour: 0,
            enRetard: 0
        };

        epargnes.forEach((e: EpargneDueMensuelle) => {
            stats.totalMontantDu += Number(e.montantDu);
            stats.totalMontantPaye += Number(e.montantPaye);
            if (e.statut === StatutDu.A_JOUR || e.statut === StatutDu.SURPAYE) {
                stats.aJour++;
            } else {
                stats.enRetard++;
            }
        });

        if (stats.totalMontantDu > 0) {
            stats.tauxRecouvrement = Math.round((stats.totalMontantPaye / stats.totalMontantDu) * 10000) / 100;
        }

        return stats;
    }

    private formatResponse(epargneDue: EpargneDueMensuelle): EpargneDueResponseDto {
        return {
            id: epargneDue.id,
            reunionId: epargneDue.reunionId,
            exerciceMembreId: epargneDue.exerciceMembreId,
            montantDu: Number(epargneDue.montantDu),
            montantPaye: Number(epargneDue.montantPaye),
            soldeRestant: Number(epargneDue.soldeRestant),
            statut: epargneDue.statut,
            creeLe: epargneDue.creeLe
        };
    }
}

export const epargneDueService = new EpargneDueService();
