/**
 * Middleware PlanGuard
 * Vérifie les limites du plan d'abonnement avant les opérations de création
 */

import { Request, Response, NextFunction } from 'express';
import { AppDataSource } from '../../config';
import { Organisation } from '../../modules/organisations/entities/organisation.entity';
import { PlanAbonnement } from '../../modules/organisations/entities/plan-abonnement.entity';
import { ForbiddenError } from '../errors';

type PlanLimitKey = 'maxTontines' | 'maxMembreParTontine' | 'maxExercicesParTontine';

/**
 * Vérifie la limite d'une ressource pour le plan actif de l'organisation.
 * @param limitKey - Champ du plan à vérifier
 * @param countFn  - Fonction retournant le nombre actuel de ressources
 */
export function planGuard(
  limitKey: PlanLimitKey,
  countFn: (organisationId: string) => Promise<number>
) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const organisationId = req.user?.organisationId;
      if (!organisationId) {
        // Pas de contexte org : on laisse passer (les autres middlewares gèrent)
        return next();
      }

      const org = await AppDataSource.getRepository(Organisation).findOne({
        where: { id: organisationId },
        relations: ['planAbonnement'],
      });

      if (!org?.planAbonnement) return next();

      const plan = org.planAbonnement as PlanAbonnement;
      const limit: number = plan[limitKey] as number;

      // -1 = illimité
      if (limit === -1) return next();

      const current = await countFn(organisationId);
      if (current >= limit) {
        throw new ForbiddenError(
          `Limite atteinte pour votre plan "${plan.libelle}" : maximum ${limit} (${limitKey}). ` +
            `Passez à un plan supérieur pour continuer.`
        );
      }

      next();
    } catch (err) {
      next(err);
    }
  };
}
