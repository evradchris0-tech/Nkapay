/**
 * Configuration Swagger/OpenAPI pour la documentation automatique de l'API
 * Genere une interface interactive accessible via /api-docs
 */

import swaggerJsdoc from 'swagger-jsdoc';
import { env } from './env.config';

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Nkapay API',
    version: '1.0.0',
    description: `
      API REST pour le systeme de gestion de tontines Nkapay.
      
      Cette API permet de gerer l'ensemble des operations liees aux tontines:
      - Gestion des utilisateurs et authentification
      - Creation et administration des tontines
      - Gestion des exercices comptables
      - Suivi des reunions et cotisations
      - Gestion des prets et remboursements
      - Module de secours mutuel
      - Rapports et tableaux de bord
    `,
    contact: {
      name: 'Support Nkapay',
      email: 'support@nkapay.com',
    },
    license: {
      name: 'Proprietary',
    },
  },
  servers: [
    {
      url: `http://localhost:${env.port}${env.apiPrefix}`,
      description: 'Serveur de developpement',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Token JWT obtenu via /auth/login',
      },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: false,
          },
          message: {
            type: 'string',
            example: 'Une erreur est survenue',
          },
          errors: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                field: { type: 'string' },
                message: { type: 'string' },
              },
            },
          },
        },
      },
      Pagination: {
        type: 'object',
        properties: {
          page: { type: 'integer', example: 1 },
          limit: { type: 'integer', example: 20 },
          total: { type: 'integer', example: 100 },
          totalPages: { type: 'integer', example: 5 },
        },
      },
    },
    responses: {
      UnauthorizedError: {
        description: "Token d'authentification manquant ou invalide",
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error',
            },
          },
        },
      },
      NotFoundError: {
        description: 'Ressource non trouvee',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error',
            },
          },
        },
      },
      ValidationError: {
        description: 'Erreur de validation des donnees',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error',
            },
          },
        },
      },
    },
  },
  security: [
    {
      bearerAuth: [],
    },
  ],
  tags: [
    { name: 'Auth', description: 'Authentification et gestion des sessions' },
    { name: 'Utilisateurs', description: 'Gestion des utilisateurs' },
    { name: 'Tontines', description: 'Gestion des tontines' },
    { name: 'Exercices', description: 'Gestion des exercices comptables' },
    { name: 'Reunions', description: 'Gestion des reunions' },
    { name: 'Transactions', description: 'Operations financieres' },
    { name: 'Prets', description: 'Gestion des prets' },
    { name: 'Secours', description: 'Module de secours mutuel' },
  ],
};

const options: swaggerJsdoc.Options = {
  definition: swaggerDefinition,
  apis: [
    './src/modules/**/routes/*.routes.ts',
    './src/modules/**/controllers/*.controller.ts',
    './src/modules/**/dtos/*.dto.ts',
  ],
};

export const swaggerSpec = swaggerJsdoc(options);
