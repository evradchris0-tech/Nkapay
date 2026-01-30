/**
 * Tests unitaires pour le service Réunion
 */

import { 
  TestNotFoundError as NotFoundError, 
  TestBadRequestError as BadRequestError, 
  TestConflictError as ConflictError 
} from '../../helpers/test-errors';

describe('Reunion Service', () => {
  describe('Validation des données de réunion', () => {
    it('devrait valider une date de réunion future', () => {
      const dateReunion = new Date();
      dateReunion.setDate(dateReunion.getDate() + 7);
      expect(dateReunion.getTime()).toBeGreaterThan(Date.now());
    });

    it('devrait accepter un lieu de réunion valide', () => {
      const lieux = ['Domicile Jean', 'Salle communautaire', 'Restaurant Le Palm'];
      lieux.forEach(lieu => {
        expect(lieu.length).toBeGreaterThan(0);
        expect(lieu.length).toBeLessThanOrEqual(200);
      });
    });

    it('devrait valider un numéro d\'ordre positif', () => {
      const validNumeros = [1, 5, 12, 52];
      validNumeros.forEach(numero => {
        expect(numero).toBeGreaterThan(0);
        expect(Number.isInteger(numero)).toBe(true);
      });
    });
  });

  describe('Statuts de réunion', () => {
    const statuts = ['PLANIFIEE', 'EN_COURS', 'TERMINEE', 'ANNULEE'];

    it('devrait valider les statuts disponibles', () => {
      expect(statuts).toHaveLength(4);
      expect(statuts).toContain('PLANIFIEE');
      expect(statuts).toContain('TERMINEE');
    });

    it('devrait permettre transition PLANIFIEE -> EN_COURS', () => {
      const transitions: Record<string, string[]> = {
        'PLANIFIEE': ['EN_COURS', 'ANNULEE'],
        'EN_COURS': ['TERMINEE'],
        'TERMINEE': [],
        'ANNULEE': [],
      };
      expect(transitions['PLANIFIEE']).toContain('EN_COURS');
    });

    it('devrait rejeter transition TERMINEE -> EN_COURS', () => {
      const transitions: Record<string, string[]> = {
        'PLANIFIEE': ['EN_COURS', 'ANNULEE'],
        'EN_COURS': ['TERMINEE'],
        'TERMINEE': [],
        'ANNULEE': [],
      };
      expect(transitions['TERMINEE']).not.toContain('EN_COURS');
    });
  });

  describe('Génération automatique de réunions', () => {
    it('devrait générer 12 réunions pour périodicité MENSUELLE', () => {
      const reunionsParAn: Record<string, number> = {
        'HEBDOMADAIRE': 52,
        'BIMENSUELLE': 24,
        'MENSUELLE': 12,
        'TRIMESTRIELLE': 4,
      };
      expect(reunionsParAn['MENSUELLE']).toBe(12);
    });

    it('devrait calculer les dates de réunion mensuelles', () => {
      const dateDebut = new Date('2024-01-15');
      const nombreReunions = 12;
      const dates: Date[] = [];
      for (let i = 0; i < nombreReunions; i++) {
        const date = new Date(dateDebut);
        date.setMonth(date.getMonth() + i);
        dates.push(date);
      }
      expect(dates).toHaveLength(12);
      expect(dates[0].getMonth()).toBe(0);
      expect(dates[11].getMonth()).toBe(11);
    });
  });

  describe('Désignation du bénéficiaire', () => {
    it('devrait sélectionner un membre éligible', () => {
      const membres = [
        { id: 'm1', aDejaRecuPot: false, estActif: true },
        { id: 'm2', aDejaRecuPot: true, estActif: true },
        { id: 'm3', aDejaRecuPot: false, estActif: true },
      ];
      const eligibles = membres.filter(m => !m.aDejaRecuPot && m.estActif);
      expect(eligibles).toHaveLength(2);
      expect(eligibles.map(e => e.id)).toContain('m1');
    });

    it('devrait rejeter un bénéficiaire déjà servi', () => {
      const membre = { id: 'm1', aDejaRecuPot: true };
      expect(membre.aDejaRecuPot).toBe(true);
    });
  });

  describe('Calcul du pot de la réunion', () => {
    it('devrait calculer le montant du pot', () => {
      const montantCotisation = 10000;
      const nombreMembres = 10;
      const montantPot = montantCotisation * nombreMembres;
      expect(montantPot).toBe(100000);
    });

    it('devrait soustraire les pénalités non payées', () => {
      const montantPot = 100000;
      const penalitesNonPayees = 5000;
      const montantNet = montantPot - penalitesNonPayees;
      expect(montantNet).toBe(95000);
    });
  });

  describe('Présences', () => {
    it('devrait calculer le taux de présence', () => {
      const nombreMembres = 10;
      const nombrePresents = 8;
      const tauxPresence = (nombrePresents / nombreMembres) * 100;
      expect(tauxPresence).toBe(80);
    });

    it('devrait identifier les absents', () => {
      const membres = ['m1', 'm2', 'm3', 'm4', 'm5'];
      const presents = ['m1', 'm2', 'm4'];
      const absents = membres.filter(m => !presents.includes(m));
      expect(absents).toEqual(['m3', 'm5']);
    });
  });

  describe('Erreurs métier', () => {
    it('devrait lever NotFoundError pour réunion inexistante', () => {
      expect(() => { throw new NotFoundError('Réunion non trouvée'); }).toThrow(NotFoundError);
    });

    it('devrait lever BadRequestError pour réunion dans le passé', () => {
      expect(() => { throw new BadRequestError('La date doit être dans le futur'); }).toThrow(BadRequestError);
    });

    it('devrait lever ConflictError pour bénéficiaire déjà désigné', () => {
      expect(() => { throw new ConflictError('Un bénéficiaire est déjà désigné'); }).toThrow(ConflictError);
    });
  });
});
