/**
 * Point d'entree de l'application Express
 * Configure les middlewares, routes et demarre le serveur
 */

import 'reflect-metadata';
import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';

import { env, initializeDatabase, swaggerSpec } from './config';
import { errorHandler, requestLogger, ApiResponse, logger } from './shared';
import { authRoutes } from './modules/auth/routes';
import { utilisateurRoutes } from './modules/utilisateurs/routes';
import { tontineModuleRoutes } from './modules/tontines/routes';
import { exerciceModuleRoutes } from './modules/exercices/routes';
import { reunionModuleRoutes } from './modules/reunions/routes';
import { penaliteModuleRoutes } from './modules/penalites/routes';
import { secoursModuleRoutes } from './modules/secours/routes';
import { transactionModuleRoutes } from './modules/transactions/routes';
import { pretModuleRoutes } from './modules/prets/routes';
import { distributionModuleRoutes } from './modules/distributions/routes';
import { adhesionModuleRoutes } from './modules/adhesions/routes';

class App {
  public app: Application;

  constructor() {
    this.app = express();
    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeSwagger();
    this.initializeErrorHandling();
  }

  /**
   * Configure les middlewares globaux
   */
  private initializeMiddlewares(): void {
    // Securite HTTP
    this.app.use(helmet());

    // CORS
    this.app.use(
      cors({
        origin: env.cors.origin,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
      })
    );

    // Parsing du corps des requetes
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Logging des requetes
    this.app.use(requestLogger);
  }

  /**
   * Configure les routes de l'API
   */
  private initializeRoutes(): void {
    // Route de sante pour les health checks
    this.app.get('/health', (_req: Request, res: Response) => {
      res.json(
        ApiResponse.success({
          status: 'healthy',
          timestamp: new Date().toISOString(),
          uptime: process.uptime(),
        })
      );
    });

    // Routes metier avec prefixe API
    this.app.use(`${env.apiPrefix}/auth`, authRoutes);
    this.app.use(`${env.apiPrefix}/utilisateurs`, utilisateurRoutes);
    this.app.use(`${env.apiPrefix}/tontines`, tontineModuleRoutes);
    this.app.use(env.apiPrefix, exerciceModuleRoutes);
    this.app.use(env.apiPrefix, reunionModuleRoutes);
    this.app.use(env.apiPrefix, penaliteModuleRoutes);
    this.app.use(env.apiPrefix, secoursModuleRoutes);
    this.app.use(env.apiPrefix, transactionModuleRoutes);
    this.app.use(env.apiPrefix, pretModuleRoutes);
    this.app.use(env.apiPrefix, distributionModuleRoutes);
    this.app.use(env.apiPrefix, adhesionModuleRoutes);

    // Route par defaut pour les chemins non trouves
    this.app.use('*', (_req: Request, res: Response) => {
      res.status(404).json(ApiResponse.error('Route non trouvee'));
    });
  }

  /**
   * Configure Swagger pour la documentation API
   */
  private initializeSwagger(): void {
    this.app.use(
      '/api-docs',
      swaggerUi.serve,
      swaggerUi.setup(swaggerSpec, {
        explorer: true,
        customCss: '.swagger-ui .topbar { display: none }',
        customSiteTitle: 'Nkapay API Documentation',
      })
    );
  }

  /**
   * Configure le gestionnaire d'erreurs global
   */
  private initializeErrorHandling(): void {
    this.app.use(errorHandler);
  }

  /**
   * Demarre le serveur et initialise la connexion a la base de donnees
   */
  public async start(): Promise<void> {
    try {
      // Connexion a la base de donnees
      await initializeDatabase();
      logger.info('Connexion a la base de donnees etablie');

      // Demarrage du serveur HTTP
      this.app.listen(env.port, () => {
        logger.info(`Serveur demarre sur le port ${env.port}`);
        logger.info(`Documentation API: http://localhost:${env.port}/api-docs`);
        logger.info(`Environnement: ${env.nodeEnv}`);
      });
    } catch (error) {
      logger.error('Erreur lors du demarrage de l\'application:', error);
      process.exit(1);
    }
  }
}

// Demarrage de l'application
const application = new App();
application.start();

export default application.app;
