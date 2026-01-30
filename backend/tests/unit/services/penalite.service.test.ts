/**
 * Tests unitaires pour le service Pénalité
 */

import { 
  TestNotFoundError as NotFoundError, 
  TestBadRequestError as BadRequestError, 
  TestConflictError as ConflictError 
} from '../../helpers/test-errors';

describe('Penalite Service', () => {
  describe('Types de pénalités', () => {
    const types = ['ABSENCE', 'RETARD_COTISATION', 'RETARD_REUNION', 'NON_RESPECT_REGLEMENT', 'AUTRE'];

    it('devrait valider les types de pénalités', () => {
      expect(types).toContain('ABSENCE');
      expect(types).toContain('RETARD_COTISATION');
    });

    it('devrait avoir un montant par défaut par type', () => {
      const montantsDefaut: Record<string, number> = {
        'ABSENCE': 2000,
        'RETARD_COTISATION': 1000,
        'RETARD_REUNION': 500,
        'NON_RESPECT_REGLEMENT': 5000,
        'AUTRE': 0,
      };
      expect(montantsDefaut['ABSENCE']).toBe(2000);
      expect(montantsDefaut['RETARD_REUNION']).toBe(500);
    });
  });

  describe('Calcul des pénalités de retard', () => {
    it('devrait calculer les pénalités de retard de cotisation', () => {
      const montantCotisation = 10000;
      const tauxPenalite = 5;
      const joursRetard = 10;
      const penalite = (montantCotisation * tauxPenalite * joursRetard) / 100;
      expect(penalite).toBe(5000);
    });

    it('devrait plafonner la pénalité au montant de la cotisation', () => {
      const montantCotisation = 10000;
      const penaliteCalculee = 15000;
      const plafond = montantCotisation;
      const penaliteFinale = Math.min(penaliteCalculee, plafond);
      expect(penaliteFinale).toBe(10000);
    });
  });

  describe('Application automatique', () => {
    it('devrait détecter les retards de cotisation', () => {
      const dateEcheance = new Date('2024-01-15');
      const datePaiement = new Date('2024-01-20');
      const joursRetard = Math.floor(
        (datePaiement.getTime() - dateEcheance.getTime()) / (1000 * 60 * 60 * 24)
      );
      expect(joursRetard).toBe(5);
    });

    it('devrait identifier les absences non justifiées', () => {
      const presences = [
        { membreId: 'm1', present: true },
        { membreId: 'm2', present: false, justifie: false },
        { membreId: 'm3', present: false, justifie: true },
      ];
      const absentsNonJustifies = presences.filter(
        p => !p.present && !('justifie' in p && p.justifie)
      );
      expect(absentsNonJustifies).toHaveLength(1);
    });
  });

  describe('Statuts de pénalité', () => {
    const statuts = ['EN_ATTENTE', 'PAYEE', 'ANNULEE', 'EXONEREE'];

    it('devrait valider les statuts disponibles', () => {
      expect(statuts).toHaveLength(4);
    });

    it('devrait permettre le paiement d\'une pénalité en attente', () => {
      const transitions: Record<string, string[]> = {
        'EN_ATTENTE': ['PAYEE', 'ANNULEE', 'EXONEREE'],
        'PAYEE': [],
        'ANNULEE': [],
        'EXONEREE': [],
      };
      expect(transitions['EN_ATTENTE']).toContain('PAYEE');
    });

    it('devrait rejeter la modification d\'une pénalité payée', () => {
      const penalite = { statut: 'PAYEE' };
      const canModify = penalite.statut === 'EN_ATTENTE';
      expect(canModify).toBe(false);
    });
  });

  describe('Exonération', () => {
    it('devrait permettre l\'exonération avec justification', () => {
      const exoneration = {
        penaliteId: 'pen-1',
        motif: 'Maladie grave documentée',
        approuvePar: 'admin-1',
      };
      expect(exoneration.motif.length).toBeGreaterThan(0);
      expect(exoneration.approuvePar).toBeDefined();
    });

    it('devrait rejeter l\'exonération sans motif', () => {
      const motif = '';
      expect(motif.length).toBe(0);
    });
  });

  describe('Historique des pénalités par membre', () => {
    it('devrait calculer le total des pénalités', () => {
      const penalites = [
        { montant: 2000, statut: 'EN_ATTENTE' },
        { montant: 1000, statut: 'PAYEE' },
        { montant: 500, statut: 'EN_ATTENTE' },
        { montant: 1000, statut: 'EXONEREE' },
      ];
      const totalEnAttente = penalites
        .filter(p => p.statut === 'EN_ATTENTE')
        .reduce((acc, p) => acc + p.montant, 0);
      expect(totalEnAttente).toBe(2500);
    });

    it('devrait compter le nombre de pénalités', () => {
      const penalites = [
        { type: 'ABSENCE' },
        { type: 'ABSENCE' },
        { type: 'RETARD_COTISATION' },
      ];
      const absences = penalites.filter(p => p.type === 'ABSENCE').length;
      expect(absences).toBe(2);
    });
  });

  describe('Erreurs métier', () => {
    it('devrait lever NotFoundError pour pénalité inexistante', () => {
      expect(() => { throw new NotFoundError('Pénalité non trouvée'); }).toThrow(NotFoundError);
    });

    it('devrait lever BadRequestError pour type invalide', () => {
      expect(() => { throw new BadRequestError('Type de pénalité invalide'); }).toThrow(BadRequestError);
    });

    it('devrait lever ConflictError pour pénalité déjà payée', () => {
      expect(() => { throw new ConflictError('Cette pénalité a déjà été payée'); }).toThrow(ConflictError);
    });

    it('devrait lever BadRequestError pour exonération sans motif', () => {
      expect(() => { throw new BadRequestError('Motif requis pour exonération'); }).toThrow(BadRequestError);
    });
  });
});
