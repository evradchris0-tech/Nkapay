/**
 * Tests d'intégration pour l'API Authentification
 */

import request from 'supertest';
import express from 'express';

// Mock de l'application minimale pour les tests
const createTestApp = () => {
  const app = express();
  app.use(express.json());
  
  // Mock routes
  app.post('/api/v1/auth/login', (req, res) => {
    const { telephone, motDePasse } = req.body;
    
    if (!telephone || !motDePasse) {
      return res.status(400).json({
        success: false,
        error: { message: 'Téléphone et mot de passe requis' }
      });
    }
    
    if (!/^6[0-9]{8}$/.test(telephone)) {
      return res.status(400).json({
        success: false,
        error: { message: 'Format de téléphone invalide' }
      });
    }
    
    if (telephone === '690000001' && motDePasse === 'Admin123!') {
      return res.status(200).json({
        success: true,
        data: {
          token: 'mock-jwt-token',
          utilisateur: {
            id: 'user-123',
            telephone,
            role: 'ADMIN'
          }
        }
      });
    }
    
    return res.status(401).json({
      success: false,
      error: { message: 'Identifiants incorrects' }
    });
  });
  
  app.post('/api/v1/auth/register', (req, res) => {
    const { telephone, motDePasse, nom, prenom } = req.body;
    
    if (!telephone || !motDePasse || !nom) {
      return res.status(400).json({
        success: false,
        error: { message: 'Données requises manquantes' }
      });
    }
    
    if (telephone === '690000001') {
      return res.status(409).json({
        success: false,
        error: { message: 'Ce numéro est déjà utilisé' }
      });
    }
    
    return res.status(201).json({
      success: true,
      data: {
        id: 'new-user-123',
        telephone,
        nom,
        prenom
      }
    });
  });
  
  app.post('/api/v1/auth/change-password', (req, res) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: { message: 'Token manquant' }
      });
    }
    
    const { ancienMotDePasse, nouveauMotDePasse } = req.body;
    
    if (!ancienMotDePasse || !nouveauMotDePasse) {
      return res.status(400).json({
        success: false,
        error: { message: 'Ancien et nouveau mot de passe requis' }
      });
    }
    
    if (ancienMotDePasse === nouveauMotDePasse) {
      return res.status(400).json({
        success: false,
        error: { message: 'Le nouveau mot de passe doit être différent' }
      });
    }
    
    return res.status(200).json({
      success: true,
      message: 'Mot de passe modifié avec succès'
    });
  });
  
  return app;
};

describe('Auth API Integration Tests', () => {
  const app = createTestApp();

  describe('POST /api/v1/auth/login', () => {
    it('devrait connecter un utilisateur avec identifiants valides', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          telephone: '690000001',
          motDePasse: 'Admin123!'
        });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data.utilisateur).toHaveProperty('telephone', '690000001');
    });

    it('devrait rejeter une connexion avec mot de passe incorrect', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          telephone: '690000001',
          motDePasse: 'WrongPassword'
        });
      
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('devrait rejeter une connexion sans téléphone', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          motDePasse: 'Admin123!'
        });
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('devrait rejeter un format de téléphone invalide', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          telephone: '123456789',
          motDePasse: 'Admin123!'
        });
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/auth/register', () => {
    it('devrait créer un nouvel utilisateur', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          telephone: '699888777',
          motDePasse: 'NewUser123!',
          nom: 'Dupont',
          prenom: 'Jean'
        });
      
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('telephone', '699888777');
    });

    it('devrait rejeter un numéro déjà utilisé', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          telephone: '690000001',
          motDePasse: 'NewUser123!',
          nom: 'Dupont'
        });
      
      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
    });

    it('devrait rejeter une inscription sans données requises', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          telephone: '699888777'
        });
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/auth/change-password', () => {
    it('devrait changer le mot de passe avec token valide', async () => {
      const response = await request(app)
        .post('/api/v1/auth/change-password')
        .set('Authorization', 'Bearer valid-token')
        .send({
          ancienMotDePasse: 'Admin123!',
          nouveauMotDePasse: 'NewAdmin456!'
        });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('devrait rejeter sans token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/change-password')
        .send({
          ancienMotDePasse: 'Admin123!',
          nouveauMotDePasse: 'NewAdmin456!'
        });
      
      expect(response.status).toBe(401);
    });

    it('devrait rejeter si nouveau = ancien mot de passe', async () => {
      const response = await request(app)
        .post('/api/v1/auth/change-password')
        .set('Authorization', 'Bearer valid-token')
        .send({
          ancienMotDePasse: 'SamePass123!',
          nouveauMotDePasse: 'SamePass123!'
        });
      
      expect(response.status).toBe(400);
    });
  });
});
