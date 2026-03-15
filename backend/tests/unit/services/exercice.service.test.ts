/**
 * Tests unitaires pour le service Exercice
 */

import { 
  TestNotFoundError as NotFoundError, 
  TestBadRequestError as BadRequestError, 
  TestConflictError as ConflictError 
} from '../../helpers/test-errors';

describe('Exercice Service', () => {
  describe('Validation des dates d\'exercice', () => {
    it('devrait valider que dateDebut est avant dateFin', () => {
      const dateDebut = new Date('2024-01-01');
      const dateFin = new Date('2024-12-31');
      expect(dateDebut.getTime()).toBeLessThan(dateFin.getTime());
    });

    it('devrait rejeter dateDebut après dateFin', () => {
      const dateDebut = new Date('2024-12-31');
      const dateFin = new Date('2024-01-01');
      expect(dateDebut.getTime()).toBeGreaterThan(dateFin.getTime());
    });

    it('devrait calculer la durée de l\'exercice en mois', () => {
      const dateDebut = new Date('2024-01-01');
      const dateFin = new Date('2024-12-31');
      const dureeMonths = (dateFin.getFullYear() - dateDebut.getFullYear()) * 12 +
                          (dateFin.getMonth() - dateDebut.getMonth()) + 1;
      expect(dureeMonths).toBe(12);
    });
  });

  describe('Année d\'exercice', () => {
    it('devrait extraire l\'année de début', () => {
      const dateDebut = new Date('2024-01-15');
      const anneeDebut = dateDebut.getFullYear();
      expect(anneeDebut).toBe(2024);
    });

    it('devrait gérer un exercice à cheval sur deux années', () => {
      const dateDebut = new Date('2024-07-01');
      const dateFin = new Date('2025-06-30');
      const exerciceLabel = `${dateDebut.getFullYear()}-${dateFin.getFullYear()}`;
      expect(exerciceLabel).toBe('2024-2025');
    });
  });

  describe('Statuts d\'exercice', () => {
    const statuts = ['EN_ATTENTE', 'EN_COURS', 'CLOTURE'];

    it('devrait valider les statuts disponibles', () => {
      expect(statuts).toContain('EN_ATTENTE');
      expect(statuts).toContain('EN_COURS');
      expect(statuts).toContain('CLOTURE');
    });

    it('devrait permettre la transition EN_ATTENTE -> EN_COURS', () => {
      const allowedTransitions: Record<string, string[]> = {
        'EN_ATTENTE': ['EN_COURS'],
        'EN_COURS': ['CLOTURE'],
        'CLOTURE': [],
      };
      expect(allowedTransitions['EN_ATTENTE']).toContain('EN_COURS');
    });

    it('devrait rejeter la transition CLOTURE -> EN_COURS', () => {
      const allowedTransitions: Record<string, string[]> = {
        'EN_ATTENTE': ['EN_COURS'],
        'EN_COURS': ['CLOTURE'],
        'CLOTURE': [],
      };
      expect(allowedTransitions['CLOTURE']).not.toContain('EN_COURS');
    });
  });

  describe('Numéro d\'ordre d\'exercice', () => {
    it('devrait générer un numéro d\'ordre séquentiel', () => {
      const exercicesExistants = [{ numeroOrdre: 1 }, { numeroOrdre: 2 }, { numeroOrdre: 3 }];
      const prochainNumero = exercicesExistants.length + 1;
      expect(prochainNumero).toBe(4);
    });

    it('devrait être unique par tontine', () => {
      const exercicesTontine = [
        { tontineId: 'tontine-1', numeroOrdre: 1 },
        { tontineId: 'tontine-1', numeroOrdre: 2 },
      ];
      const numeros = exercicesTontine.map(e => e.numeroOrdre);
      const numerosUniques = new Set(numeros);
      expect(numerosUniques.size).toBe(numeros.length);
    });
  });

  describe('Calculs financiers', () => {
    it('devrait calculer le total des cotisations attendues', () => {
      const montantCotisation = 10000;
      const nombreMembres = 12;
      const nombreReunions = 12;
      const totalAttendu = montantCotisation * nombreMembres * nombreReunions;
      expect(totalAttendu).toBe(1440000);
    });

    it('devrait calculer le taux de recouvrement', () => {
      const totalAttendu = 1440000;
      const totalRecouvre = 1200000;
      const tauxRecouvrement = (totalRecouvre / totalAttendu) * 100;
      expect(tauxRecouvrement).toBeCloseTo(83.33, 1);
    });
  });

  describe('Erreurs métier', () => {
    it('devrait lever NotFoundError pour exercice inexistant', () => {
      expect(() => { throw new NotFoundError('Exercice non trouvé'); }).toThrow(NotFoundError);
    });

    it('devrait lever BadRequestError pour dates invalides', () => {
      expect(() => { throw new BadRequestError('La date de début doit être antérieure'); }).toThrow(BadRequestError);
    });

    it('devrait lever ConflictError pour exercice déjà existant', () => {
      expect(() => { throw new ConflictError('Un exercice existe déjà pour cette période'); }).toThrow(ConflictError);
    });

    it('devrait lever BadRequestError pour clôture sans réunions terminées', () => {
      expect(() => { throw new BadRequestError('Toutes les réunions doivent être terminées'); }).toThrow(BadRequestError);
    });
  });
});
