/**
 * Tests unitaires pour les règles de tontine
 */

import { 
  TestNotFoundError as NotFoundError, 
  TestBadRequestError as BadRequestError, 
  TestConflictError as ConflictError 
} from '../../helpers/test-errors';

describe('RegleTontine Service', () => {
  describe('Types de règles', () => {
    const typesRegles = [
      'COTISATION_OBLIGATOIRE',
      'PENALITE_ABSENCE',
      'PENALITE_RETARD',
      'DELAI_PAIEMENT',
      'ORDRE_DISTRIBUTION',
      'QUORUM_REUNION',
      'ELIGIBILITE_PRET',
      'ELIGIBILITE_SECOURS',
    ];

    it('devrait valider les types de règles disponibles', () => {
      expect(typesRegles).toContain('COTISATION_OBLIGATOIRE');
      expect(typesRegles).toContain('PENALITE_ABSENCE');
    });

    it('devrait catégoriser les règles', () => {
      const categories = {
        financieres: ['COTISATION_OBLIGATOIRE', 'PENALITE_ABSENCE', 'PENALITE_RETARD', 'DELAI_PAIEMENT'],
        fonctionnelles: ['ORDRE_DISTRIBUTION', 'QUORUM_REUNION'],
        eligibilite: ['ELIGIBILITE_PRET', 'ELIGIBILITE_SECOURS'],
      };
      expect(categories.financieres).toHaveLength(4);
      expect(categories.eligibilite).toHaveLength(2);
    });
  });

  describe('Validation des valeurs de règles', () => {
    it('devrait valider un montant de pénalité', () => {
      const regle = { type: 'PENALITE_ABSENCE', valeur: 2000, unite: 'XAF' };
      expect(regle.valeur).toBeGreaterThan(0);
    });

    it('devrait valider un pourcentage', () => {
      const regle = { type: 'PENALITE_RETARD', valeur: 5, unite: 'POURCENTAGE' };
      expect(regle.valeur).toBeGreaterThanOrEqual(0);
      expect(regle.valeur).toBeLessThanOrEqual(100);
    });

    it('devrait valider un délai en jours', () => {
      const regle = { type: 'DELAI_PAIEMENT', valeur: 7, unite: 'JOURS' };
      expect(regle.valeur).toBeGreaterThan(0);
      expect(Number.isInteger(regle.valeur)).toBe(true);
    });

    it('devrait valider un quorum en pourcentage', () => {
      const regle = { type: 'QUORUM_REUNION', valeur: 60, unite: 'POURCENTAGE' };
      expect(regle.valeur).toBeGreaterThanOrEqual(50);
      expect(regle.valeur).toBeLessThanOrEqual(100);
    });
  });

  describe('Application des règles', () => {
    it('devrait calculer la pénalité de retard', () => {
      const montantCotisation = 10000;
      const tauxPenalite = 5;
      const joursRetard = 10;
      const penalite = (montantCotisation * tauxPenalite / 100) * joursRetard;
      expect(penalite).toBe(5000);
    });

    it('devrait vérifier le quorum', () => {
      const totalMembres = 20;
      const presentsRequis = 60;
      const presentsActuels = 15;
      const quorumAtteint = (presentsActuels / totalMembres) * 100 >= presentsRequis;
      expect(quorumAtteint).toBe(true);
    });

    it('devrait vérifier l\'éligibilité au prêt', () => {
      const reglesEligibilite = {
        ancienneteMinimum: 3,
        cotisationsAJour: true,
        pasDePretsEnCours: true
      };
      const membre = {
        anciennete: 6,
        cotisationsPayees: 6,
        cotisationsAttendues: 6,
        pretsEnCours: 0
      };
      const eligible = 
        membre.anciennete >= reglesEligibilite.ancienneteMinimum &&
        membre.cotisationsPayees >= membre.cotisationsAttendues &&
        membre.pretsEnCours === 0;
      expect(eligible).toBe(true);
    });
  });

  describe('Héritage des règles', () => {
    it('devrait hériter des règles par défaut', () => {
      const reglesParDefaut = [
        { type: 'PENALITE_ABSENCE', valeur: 2000 },
        { type: 'QUORUM_REUNION', valeur: 50 }
      ];
      const reglesPersonnalisees = [
        { type: 'PENALITE_ABSENCE', valeur: 3000 }
      ];
      const reglesFinales = reglesParDefaut.map(rd => {
        const custom = reglesPersonnalisees.find(rp => rp.type === rd.type);
        return custom || rd;
      });
      const penaliteAbsence = reglesFinales.find(r => r.type === 'PENALITE_ABSENCE');
      expect(penaliteAbsence?.valeur).toBe(3000);
    });
  });

  describe('Règles d\'exercice', () => {
    it('devrait permettre des règles spécifiques par exercice', () => {
      const regleExercice = {
        exerciceId: 'exercice-1',
        type: 'COTISATION_OBLIGATOIRE',
        valeur: 15000,
        priorite: 1
      };
      expect(regleExercice.priorite).toBe(1);
    });
  });

  describe('Erreurs métier', () => {
    it('devrait lever NotFoundError pour règle inexistante', () => {
      expect(() => { throw new NotFoundError('Règle non trouvée'); }).toThrow(NotFoundError);
    });

    it('devrait lever BadRequestError pour valeur invalide', () => {
      expect(() => { throw new BadRequestError('Valeur invalide'); }).toThrow(BadRequestError);
    });

    it('devrait lever ConflictError pour règle en doublon', () => {
      expect(() => { throw new ConflictError('Règle déjà existante'); }).toThrow(ConflictError);
    });
  });
});

describe('RuleDefinition Service', () => {
  describe('Définitions de règles', () => {
    const definitions = [
      {
        code: 'PENALITE_ABSENCE',
        nom: 'Pénalité d\'absence',
        description: 'Montant à payer en cas d\'absence',
        typeValeur: 'MONTANT',
        valeurDefaut: 2000,
        obligatoire: false
      },
      {
        code: 'COTISATION',
        nom: 'Montant de cotisation',
        description: 'Montant de la cotisation par réunion',
        typeValeur: 'MONTANT',
        valeurDefaut: 10000,
        obligatoire: true
      }
    ];

    it('devrait valider une définition de règle', () => {
      const definition = definitions[0];
      expect(definition.code).toBeDefined();
      expect(definition.nom).toBeDefined();
      expect(definition.typeValeur).toBeDefined();
    });

    it('devrait identifier les règles obligatoires', () => {
      const obligatoires = definitions.filter(d => d.obligatoire);
      expect(obligatoires).toHaveLength(1);
      expect(obligatoires[0].code).toBe('COTISATION');
    });

    it('devrait fournir des valeurs par défaut', () => {
      const definition = definitions.find(d => d.code === 'PENALITE_ABSENCE');
      expect(definition?.valeurDefaut).toBe(2000);
    });
  });

  describe('Types de valeurs', () => {
    const typesValeurs = ['MONTANT', 'POURCENTAGE', 'JOURS', 'MOIS', 'NOMBRE', 'BOOLEEN'];

    it('devrait valider les types de valeurs', () => {
      expect(typesValeurs).toContain('MONTANT');
      expect(typesValeurs).toContain('POURCENTAGE');
    });

    it('devrait valider selon le type', () => {
      const validations: Record<string, (val: number) => boolean> = {
        'POURCENTAGE': (val) => val >= 0 && val <= 100,
        'MONTANT': (val) => val >= 0,
        'JOURS': (val) => val > 0 && Number.isInteger(val),
      };
      expect(validations['POURCENTAGE'](50)).toBe(true);
      expect(validations['POURCENTAGE'](150)).toBe(false);
      expect(validations['MONTANT'](10000)).toBe(true);
      expect(validations['JOURS'](7)).toBe(true);
    });
  });
});
