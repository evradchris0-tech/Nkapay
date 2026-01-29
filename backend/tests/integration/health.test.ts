/**
 * Tests d'integration pour les routes de base
 */
import request from 'supertest';
import express, { Application } from 'express';
import { ApiResponse } from '../../src/shared';

// Creer une app minimale pour les tests
function createTestApp(): Application {
  const app = express();
  app.use(express.json());

  // Route de sante
  app.get('/health', (_req, res) => {
    res.json(ApiResponse.success({
      status: 'healthy',
      timestamp: new Date().toISOString(),
    }));
  });

  // Route 404
  app.use('*', (_req, res) => {
    res.status(404).json(ApiResponse.error('Route non trouvee'));
  });

  return app;
}

describe('Health Check API', () => {
  let app: Application;

  beforeAll(() => {
    app = createTestApp();
  });

  describe('GET /health', () => {
    it('should return 200 and healthy status', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('healthy');
      expect(response.body.data.timestamp).toBeDefined();
    });
  });

  describe('Unknown routes', () => {
    it('should return 404 for unknown routes', async () => {
      const response = await request(app).get('/unknown');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('non trouvee');
    });
  });
});
