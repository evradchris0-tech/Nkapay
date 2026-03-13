/**
 * Service d'assertions multi-tenant
 * Centralise la vérification que les ressources appartiennent bien à l'organisation du requérant
 */

import { AppDataSource } from '../../config';
import { ForbiddenError, NotFoundError } from '../errors';

export class TenantAssertionService {
  /**
   * Vérifie qu'une tontine appartient à l'organisation donnée.
   * Lève ForbiddenError si ce n'est pas le cas.
   */
  async assertTontineOwnedByOrganisation(
    tontineId: string,
    organisationId: string
  ): Promise<void> {
    const result = await AppDataSource.query(
      `SELECT organisation_id FROM tontine WHERE id = ? AND supprime_le IS NULL LIMIT 1`,
      [tontineId]
    );

    if (!result || result.length === 0) {
      throw new NotFoundError(`Tontine introuvable: ${tontineId}`);
    }

    if (result[0].organisation_id !== organisationId) {
      throw new ForbiddenError(`Accès refusé : cette tontine n'appartient pas à votre organisation`);
    }
  }

  /**
   * Vérifie qu'un exercice appartient indirectement à l'organisation donnée
   * (via exercice → tontine → organisation)
   */
  async assertExerciceOwnedByOrganisation(
    exerciceId: string,
    organisationId: string
  ): Promise<void> {
    const result = await AppDataSource.query(
      `SELECT t.organisation_id
       FROM exercice e
       INNER JOIN tontine t ON e.tontine_id = t.id
       WHERE e.id = ?
       LIMIT 1`,
      [exerciceId]
    );

    if (!result || result.length === 0) {
      throw new NotFoundError(`Exercice introuvable: ${exerciceId}`);
    }

    if (result[0].organisation_id !== organisationId) {
      throw new ForbiddenError(`Accès refusé : cet exercice n'appartient pas à votre organisation`);
    }
  }

  /**
   * Vérifie qu'une réunion appartient indirectement à l'organisation
   * (via reunion → exercice → tontine → organisation)
   */
  async assertReunionOwnedByOrganisation(
    reunionId: string,
    organisationId: string
  ): Promise<void> {
    const result = await AppDataSource.query(
      `SELECT t.organisation_id
       FROM reunion r
       INNER JOIN exercice e ON r.exercice_id = e.id
       INNER JOIN tontine t ON e.tontine_id = t.id
       WHERE r.id = ?
       LIMIT 1`,
      [reunionId]
    );

    if (!result || result.length === 0) {
      throw new NotFoundError(`Réunion introuvable: ${reunionId}`);
    }

    if (result[0].organisation_id !== organisationId) {
      throw new ForbiddenError(`Accès refusé : cette réunion n'appartient pas à votre organisation`);
    }
  }
}

export const tenantAssertionService = new TenantAssertionService();
