/**
 * Index des routes du module Transactions
 */

import { Router } from 'express';
import transactionRoutes from './transaction.routes';
import operateurPaiementRoutes from './operateur-paiement.routes';
import { projetRoutes } from './projet.routes';
import { paiementMobileRoutes } from './paiement-mobile.routes';
import { duesRoutes } from './dues.routes';

const router = Router();

router.use('/transactions', transactionRoutes);
router.use('/operateurs-paiement', operateurPaiementRoutes);
router.use('/projets', projetRoutes);
router.use('/paiements-mobile', paiementMobileRoutes);
router.use('/dues', duesRoutes);

export default router;
export { router as transactionModuleRoutes };
