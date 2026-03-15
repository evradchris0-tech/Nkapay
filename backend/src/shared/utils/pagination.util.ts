/**
 * Utilitaires de pagination réutilisables
 */

import { ObjectLiteral, SelectQueryBuilder } from 'typeorm';
import { PaginationMeta } from './api-response.util';

/**
 * Paramètres de requête de pagination standard
 */
export interface PaginationQuery {
    page?: number;     // Par défaut: 1
    limit?: number;    // Par défaut: 20
    sortBy?: string;   // Champ de tri
    sortOrder?: 'ASC' | 'DESC';
}

/**
 * Résultat paginé standard renvoyé par les services
 */
export interface PaginatedResult<T> {
    data: T[];
    meta: PaginationMeta;
}

const CONSTANTS = {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100,
};

/**
 * Applique la pagination à un QueryBuilder TypeORM
 * @param queryBuilder Le constructeur de requête
 * @param query Les paramètres de pagination (page, limit, sort)
 * @returns Résultat paginé avec métadonnées
 */
export async function paginate<T extends ObjectLiteral>(
    queryBuilder: SelectQueryBuilder<T>,
    query: PaginationQuery
): Promise<PaginatedResult<T>> {
    const page = Math.max(1, Number(query.page) || CONSTANTS.DEFAULT_PAGE);
    let limit = Math.max(1, Number(query.limit) || CONSTANTS.DEFAULT_LIMIT);
    limit = Math.min(limit, CONSTANTS.MAX_LIMIT);

    // Appliquer le tri si demandé et sécurisé (éviter injection SQL basique)
    if (query.sortBy) {
        // Note: L'appelant doit s'assurer que sortBy est un champ valide de l'entité
        // ou utiliser addOrderBy s'il a besoin de jointures complexes avant d'appeler paginate
        const sortOrder = query.sortOrder === 'DESC' ? 'DESC' : 'ASC';

        // Protection basique: on n'applique le tri que si le champ ressemble à une propriété valide
        // (lettres, chiffres, underscore, points pour les relations)
        if (/^[a-zA-Z0-9_.]+$/.test(query.sortBy)) {
            queryBuilder.addOrderBy(query.sortBy, sortOrder);
        }
    }

    const [data, total] = await queryBuilder
        .skip((page - 1) * limit)
        .take(limit)
        .getManyAndCount();

    const totalPages = Math.ceil(total / limit);

    return {
        data,
        meta: {
            page,
            limit,
            total,
            totalPages,
        },
    };
}

/**
 * Pagine un tableau de résultats déjà récupérés (ou pour findAndCount simple)
 * @param data Les données de la page courante
 * @param total Le nombre total d'éléments
 * @param query Les paramètres de pagination utilisés
 * @returns Résultat paginé avec métadonnées
 */
export function paginateRaw<T>(
    data: T[],
    total: number,
    query: PaginationQuery
): PaginatedResult<T> {
    const page = Math.max(1, Number(query.page) || CONSTANTS.DEFAULT_PAGE);
    let limit = Math.max(1, Number(query.limit) || CONSTANTS.DEFAULT_LIMIT);
    limit = Math.min(limit, CONSTANTS.MAX_LIMIT);

    const totalPages = Math.ceil(total / limit);

    return {
        data,
        meta: {
            page,
            limit,
            total,
            totalPages,
        },
    };
}
