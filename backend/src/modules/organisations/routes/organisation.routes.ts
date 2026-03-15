import { Router } from 'express';
import { authenticate } from '../../../shared/middlewares/auth.middleware';
import { requireOrganisation, requireOrgRole } from '../../../shared/middlewares/tenant.middleware';
import { organisationController } from '../controllers/organisation.controller';

const router = Router();

// Toutes les routes org nécessitent authentification + contexte organisation
router.use(authenticate, requireOrganisation);

// ─── Profil organisation ─────────────────────────────────────────────────────
router.get('/profile', organisationController.getProfile.bind(organisationController));
router.put('/profile', requireOrgRole('ORG_ADMIN'), organisationController.update.bind(organisationController));

// ─── Membres ─────────────────────────────────────────────────────────────────
router.get('/membres', organisationController.getMembres.bind(organisationController));
router.post('/membres', requireOrgRole('ORG_ADMIN'), organisationController.addMembre.bind(organisationController));

// ─── Règles ──────────────────────────────────────────────────────────────────
router.get('/regles', organisationController.getRegles.bind(organisationController));
router.put('/regles', requireOrgRole('ORG_ADMIN'), organisationController.setRegle.bind(organisationController));
router.delete('/regles/:ruleDefinitionId', requireOrgRole('ORG_ADMIN'), organisationController.resetRegle.bind(organisationController));

// ─── Abonnement ──────────────────────────────────────────────────────────────
router.get('/abonnement', organisationController.getAbonnement.bind(organisationController));

export { router as organisationRouter };
