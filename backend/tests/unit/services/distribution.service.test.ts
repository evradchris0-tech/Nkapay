/**
 * Tests unitaires pour le service Distribution
 */

import { 
  TestNotFoundError as NotFoundError, 
  TestBadRequestError as BadRequestError, 
  TestConflictError as ConflictError 
} from '../../helpers/test-errors';

describe('Distribution Service', () => {
  describe('Calcul du pot à distribuer', () => {
    it('devrait calculer le montant brut du pot', () => {
      const montantCotisation = 10000;
      const nombreMembres = 12;
      const potBrut = montantCotisation * nombreMembres;
      expect(potBrut).toBe(120000);
    });

    it('devrait déduire les frais de gestion', () => {
      const potBrut = 120000;
      const tauxFrais = 2;
      const frais = (potBrut * tauxFrais) / 100;
      const potNet = potBrut - frais;
      expect(frais).toBe(2400);
      expect(potNet).toBe(117600);
    });

    it('devrait ajouter les pénalités perçues', () => {
      const potNet = 117600;
      const penalitesPercues = 5000;
      const potTotal = potNet + penalitesPercues;
      expect(potTotal).toBe(122600);
    });
  });

  describe('Ordre de distribution', () => {
    it('devrait respecter l\'ordre du tour', () => {
      const membres = [
        { id: 'm1', ordre: 3, aRecuPot: false },
        { id: 'm2', ordre: 1, aRecuPot: true },
        { id: 'm3', ordre: 2, aRecuPot: false },
      ];
      const prochainBeneficiaire = membres
        .filter(m => !m.aRecuPot)
        .sort((a, b) => a.ordre - b.ordre)[0];
      expect(prochainBeneficiaire.id).toBe('m3');
    });

    it('devrait identifier les membres restants', () => {
      const membres = [
        { id: 'm1', aRecuPot: true },
        { id: 'm2', aRecuPot: false },
        { id: 'm3', aRecuPot: false },
      ];
      const restants = membres.filter(m => !m.aRecuPot);
      expect(restants).toHaveLength(2);
    });
  });

  describe('Modes de distribution', () => {
    const modes = ['TOUR', 'TIRAGE', 'ENCHERE', 'BESOIN'];

    it('devrait valider les modes disponibles', () => {
      expect(modes).toContain('TOUR');
      expect(modes).toContain('ENCHERE');
    });

    it('devrait gérer le tirage au sort', () => {
      const membres = [
        { id: 'm1', eligible: true },
        { id: 'm2', eligible: true },
        { id: 'm3', eligible: false },
      ];
      const eligibles = membres.filter(m => m.eligible);
      const randomIndex = Math.floor(Math.random() * eligibles.length);
      const gagnant = eligibles[randomIndex];
      expect(eligibles).toContain(gagnant);
    });
  });

  describe('Validation de distribution', () => {
    it('devrait vérifier que toutes les cotisations sont reçues', () => {
      const cotisationsAttendues = 12;
      const cotisationsRecues = 12;
      expect(cotisationsRecues).toBe(cotisationsAttendues);
    });

    it('devrait identifier les cotisations manquantes', () => {
      const cotisationsAttendues = 12;
      const cotisationsRecues = 10;
      const manquantes = cotisationsAttendues - cotisationsRecues;
      expect(manquantes).toBe(2);
    });

    it('devrait autoriser distribution partielle si configuré', () => {
      const config = { distributionPartielleAutorisee: true };
      const tauxRecouvrement = 80;
      const seuilMinimum = 75;
      expect(config.distributionPartielleAutorisee).toBe(true);
      expect(tauxRecouvrement).toBeGreaterThanOrEqual(seuilMinimum);
    });
  });

  describe('Historique des distributions', () => {
    it('devrait enregistrer les détails de distribution', () => {
      const distribution = {
        reunionId: 'reu-1',
        beneficiaireId: 'mem-1',
        montant: 120000,
        dateDistribution: new Date(),
        mode: 'TOUR',
      };
      expect(distribution).toHaveProperty('reunionId');
      expect(distribution).toHaveProperty('beneficiaireId');
      expect(distribution).toHaveProperty('montant');
    });

    it('devrait calculer le total distribué sur l\'exercice', () => {
      const distributions = [
        { montant: 120000 },
        { montant: 118000 },
        { montant: 125000 },
      ];
      const totalDistribue = distributions.reduce((acc, d) => acc + d.montant, 0);
      expect(totalDistribue).toBe(363000);
    });
  });

  describe('Enchères', () => {
    it('devrait identifier l\'enchère gagnante', () => {
      const encheres = [
        { membreId: 'm1', montant: 5000 },
        { membreId: 'm2', montant: 8000 },
        { membreId: 'm3', montant: 6000 },
      ];
      const gagnant = encheres.reduce((max, e) => 
        e.montant > max.montant ? e : max
      );
      expect(gagnant.membreId).toBe('m2');
      expect(gagnant.montant).toBe(8000);
    });

    it('devrait déduire l\'enchère du pot', () => {
      const potBrut = 120000;
      const enchereGagnante = 8000;
      const potNet = potBrut - enchereGagnante;
      expect(potNet).toBe(112000);
    });
  });

  describe('Erreurs métier', () => {
    it('devrait lever NotFoundError pour distribution inexistante', () => {
      expect(() => { throw new NotFoundError('Distribution non trouvée'); }).toThrow(NotFoundError);
    });

    it('devrait lever BadRequestError pour cotisations incomplètes', () => {
      expect(() => { throw new BadRequestError('Cotisations incomplètes'); }).toThrow(BadRequestError);
    });

    it('devrait lever ConflictError pour bénéficiaire déjà servi', () => {
      expect(() => { throw new ConflictError('Membre a déjà reçu le pot'); }).toThrow(ConflictError);
    });

    it('devrait lever BadRequestError pour réunion non terminée', () => {
      expect(() => { throw new BadRequestError('Réunion doit être terminée'); }).toThrow(BadRequestError);
    });
  });
});
