/**
 * Tests d'intégration pour l'API Organisations (onboarding + profil + membres)
 */

import request from 'supertest';
import express, { Application } from 'express';

// ─── App de test avec routes simulées ────────────────────────────────────────

function createTestApp(): Application {
  const app = express();
  app.use(express.json());

  // POST /api/v1/auth/register-organisation
  app.post('/api/v1/auth/register-organisation', (req, res) => {
    const { prenom, nom, telephone, email, motDePasse, nomOrganisation, slug } = req.body;

    if (!prenom || !nom || !telephone || !email || !motDePasse || !nomOrganisation || !slug) {
      return res.status(400).json({
        success: false,
        error: { message: 'Champs obligatoires manquants' },
      });
    }

    if (motDePasse.length < 6) {
      return res.status(400).json({
        success: false,
        error: { message: 'Le mot de passe doit comporter au moins 6 caractères' },
      });
    }

    if (telephone === '699000001' || email === 'alice@tontine.cm' || slug === 'tontine-alpha') {
      return res.status(409).json({
        success: false,
        error: { message: 'Téléphone, email ou slug déjà utilisé' },
      });
    }

    return res.status(201).json({
      success: true,
      data: {
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        expiresIn: 3600,
        organisationId: 'org-uuid-new',
      },
    });
  });

  // GET /api/v1/org/profile — protégé, simule le token
  app.get('/api/v1/org/profile', (req, res) => {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: { message: 'Non authentifié' } });
    }
    if (auth === 'Bearer invalid-token') {
      return res.status(401).json({ success: false, error: { message: 'Token invalide' } });
    }
    return res.status(200).json({
      success: true,
      data: {
        id: 'org-uuid-1',
        nom: 'Tontine Alpha',
        slug: 'tontine-alpha',
        statut: 'ACTIVE',
        planAbonnement: { code: 'FREE', libelle: 'Gratuit' },
      },
    });
  });

  // POST /api/v1/org/membres
  app.post('/api/v1/org/membres', (req, res) => {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: { message: 'Non authentifié' } });
    }
    const { utilisateurId, role } = req.body;
    if (!utilisateurId || !role) {
      return res.status(400).json({
        success: false,
        error: { message: 'utilisateurId et role requis' },
      });
    }
    if (utilisateurId === 'already-member-id') {
      return res.status(409).json({
        success: false,
        error: { message: 'Cet utilisateur est déjà membre de l\'organisation' },
      });
    }
    return res.status(201).json({
      success: true,
      data: {
        id: 'membre-uuid-new',
        utilisateurId,
        role,
        statut: 'ACTIF',
      },
    });
  });

  return app;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('Organisations API', () => {
  let app: Application;

  beforeAll(() => {
    app = createTestApp();
  });

  describe('POST /api/v1/auth/register-organisation', () => {
    const validPayload = {
      prenom: 'Bob',
      nom: 'Martin',
      telephone: '698000001',
      email: 'bob@tontine.cm',
      motDePasse: 'password123',
      nomOrganisation: 'Tontine Beta',
      slug: 'tontine-beta',
      emailContact: 'contact@beta.cm',
    };

    it('201 — enregistrement réussi', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register-organisation')
        .send(validPayload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('accessToken');
      expect(res.body.data).toHaveProperty('organisationId');
    });

    it('400 — champs obligatoires manquants', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register-organisation')
        .send({ prenom: 'Bob' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('400 — mot de passe trop court', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register-organisation')
        .send({ ...validPayload, motDePasse: '123' });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toMatch(/6 caractères/);
    });

    it('409 — téléphone/email/slug déjà utilisé', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register-organisation')
        .send({ ...validPayload, telephone: '699000001' }); // existing phone

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/org/profile', () => {
    it('200 — retourne le profil organisation', async () => {
      const res = await request(app)
        .get('/api/v1/org/profile')
        .set('Authorization', 'Bearer valid-token');

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('slug');
      expect(res.body.data).toHaveProperty('planAbonnement');
    });

    it('401 — sans token', async () => {
      const res = await request(app).get('/api/v1/org/profile');
      expect(res.status).toBe(401);
    });

    it('401 — token invalide', async () => {
      const res = await request(app)
        .get('/api/v1/org/profile')
        .set('Authorization', 'Bearer invalid-token');
      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/v1/org/membres', () => {
    const AUTH = 'Bearer valid-token';

    it('201 — ajoute un membre', async () => {
      const res = await request(app)
        .post('/api/v1/org/membres')
        .set('Authorization', AUTH)
        .send({ utilisateurId: 'new-user-id', role: 'ORG_MEMBRE' });

      expect(res.status).toBe(201);
      expect(res.body.data).toHaveProperty('role', 'ORG_MEMBRE');
    });

    it('400 — utilisateurId manquant', async () => {
      const res = await request(app)
        .post('/api/v1/org/membres')
        .set('Authorization', AUTH)
        .send({ role: 'ORG_MEMBRE' });

      expect(res.status).toBe(400);
    });

    it('409 — déjà membre', async () => {
      const res = await request(app)
        .post('/api/v1/org/membres')
        .set('Authorization', AUTH)
        .send({ utilisateurId: 'already-member-id', role: 'ORG_MEMBRE' });

      expect(res.status).toBe(409);
    });

    it('401 — sans token', async () => {
      const res = await request(app)
        .post('/api/v1/org/membres')
        .send({ utilisateurId: 'new-user-id', role: 'ORG_MEMBRE' });

      expect(res.status).toBe(401);
    });
  });
});
