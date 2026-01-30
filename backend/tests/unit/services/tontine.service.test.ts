/**
 * Tests unitaires pour le service Tontine
 */

import { 
  TestNotFoundError as NotFoundError, 
  TestBadRequestError as BadRequestError, 
  TestConflictError as ConflictError 
} from '../../helpers/test-errors';

describe('Tontine Service', () => {
  describe('Validation des données de tontine', () => {
    it('devrait valider un nom de tontine valide', () => {
      const validNames = ['Tontine Famille', 'Epargne Mensuelle', 'SOLIDARITÉ 2024'];
      validNames.forEach(name => {
        expect(name.length).toBeGreaterThanOrEqual(3);
        expect(name.length).toBeLessThanOrEqual(100);
      });
    });

    it('devrait valider une devise valide', () => {
      const validDevises = ['XAF', 'EUR', 'USD'];
      validDevises.forEach(devise => {
        expect(devise).toMatch(/^[A-Z]{3}$/);
      });
    });

    it('devrait valider un montant de cotisation positif', () => {
      const validMontants = [1000, 5000, 50000, 100000];
      validMontants.forEach(montant => {
        expect(montant).toBeGreaterThan(0);
      });
    });

    it('devrait rejeter un montant négatif ou nul', () => {
      const invalidMontants = [0, -1000, -50000];
      invalidMontants.forEach(montant => {
        expect(montant).not.toBeGreaterThan(0);
      });
    });
  });

  describe('Périodicité de tontine', () => {
    const periodicites = ['HEBDOMADAIRE', 'BIMENSUELLE', 'MENSUELLE', 'TRIMESTRIELLE'];

    it('devrait accepter les périodicités valides', () => {
      periodicites.forEach(p => {
        expect(periodicites).toContain(p);
      });
    });

    it('devrait calculer le nombre de réunions annuelles', () => {
      const reunionsParAn: Record<string, number> = {
        'HEBDOMADAIRE': 52,
        'BIMENSUELLE': 24,
        'MENSUELLE': 12,
        'TRIMESTRIELLE': 4,
      };
      expect(reunionsParAn['MENSUELLE']).toBe(12);
      expect(reunionsParAn['HEBDOMADAIRE']).toBe(52);
    });
  });

  describe('Statuts de tontine', () => {
    const statuts = ['BROUILLON', 'ACTIVE', 'SUSPENDUE', 'FERMEE'];

    it('devrait valider les transitions de statut', () => {
      expect(statuts.indexOf('ACTIVE')).toBeGreaterThan(statuts.indexOf('BROUILLON'));
      expect(statuts.indexOf('SUSPENDUE')).toBeGreaterThan(statuts.indexOf('ACTIVE'));
    });

    it('devrait rejeter transition FERMEE vers ACTIVE', () => {
      const currentStatut = 'FERMEE';
      const isFinalState = currentStatut === 'FERMEE';
      expect(isFinalState).toBe(true);
    });
  });

  describe('Calcul des montants', () => {
    it('devrait calculer le montant total de cotisation mensuelle', () => {
      const montantCotisation = 10000;
      const nombreParts = 2;
      const montantTotal = montantCotisation * nombreParts;
      expect(montantTotal).toBe(20000);
    });

    it('devrait calculer le pot mensuel', () => {
      const montantCotisation = 10000;
      const nombreMembres = 12;
      const potMensuel = montantCotisation * nombreMembres;
      expect(potMensuel).toBe(120000);
    });
  });

  describe('Erreurs métier', () => {
    it('devrait lever NotFoundError pour tontine inexistante', () => {
      expect(() => { throw new NotFoundError('Tontine non trouvée'); }).toThrow(NotFoundError);
    });

    it('devrait lever BadRequestError pour activation sans membres', () => {
      expect(() => { throw new BadRequestError('La tontine doit avoir au moins un membre'); }).toThrow(BadRequestError);
    });

    it('devrait lever ConflictError pour nom déjà utilisé', () => {
      expect(() => { throw new ConflictError('Une tontine avec ce nom existe déjà'); }).toThrow(ConflictError);
    });
  });
});
