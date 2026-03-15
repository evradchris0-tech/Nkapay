import { Router } from 'express';
import { authenticate } from '../../../shared/middlewares/auth.middleware';
import { requireSuperAdmin } from '../../../shared/middlewares/tenant.middleware';
import { adminController } from '../controllers/admin.controller';

const router = Router();

// Toutes les routes admin requièrent authentification + super admin
router.use(authenticate, requireSuperAdmin);

// ─── Organisations ────────────────────────────────────────────────────────────
router.get('/organisations', adminController.getAllOrganisations.bind(adminController));
router.get('/organisations/:id', adminController.getOrganisation.bind(adminController));
router.post('/organisations', adminController.createOrganisation.bind(adminController));
router.patch('/organisations/:id/suspendre', adminController.suspendOrganisation.bind(adminController));
router.patch('/organisations/:id/reactiver', adminController.reactivateOrganisation.bind(adminController));

// ─── Plans abonnement ─────────────────────────────────────────────────────────
router.get('/plans', adminController.getAllPlans.bind(adminController));
router.put('/plans/:id', adminController.updatePlan.bind(adminController));

export { router as adminRouter };
