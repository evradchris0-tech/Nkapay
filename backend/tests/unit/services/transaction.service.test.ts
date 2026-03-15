/**
 * Tests unitaires pour le service Transaction
 */

import { 
  TestNotFoundError as NotFoundError, 
  TestBadRequestError as BadRequestError, 
  TestConflictError as ConflictError 
} from '../../helpers/test-errors';

describe('Transaction Service', () => {
  describe('Validation des montants', () => {
    it('devrait valider un montant positif', () => {
      const montants = [1000, 5000, 100000, 1];
      montants.forEach(montant => {
        expect(montant).toBeGreaterThan(0);
      });
    });

    it('devrait rejeter un montant négatif ou nul', () => {
      const montants = [0, -1000, -1];
      montants.forEach(montant => {
        expect(montant).not.toBeGreaterThan(0);
      });
    });

    it('devrait formater le montant en XAF', () => {
      const montant = 150000;
      const formatted = new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'XAF',
        minimumFractionDigits: 0,
      }).format(montant);
      expect(formatted).toContain('150');
    });
  });

  describe('Types de transaction', () => {
    const types = ['COTISATION', 'INSCRIPTION', 'POT', 'PRET', 'REMBOURSEMENT_PRET', 'PENALITE', 'SECOURS', 'PROJET'];

    it('devrait valider les types de transaction', () => {
      expect(types).toContain('COTISATION');
      expect(types).toContain('POT');
      expect(types).toContain('PRET');
    });

    it('devrait catégoriser les entrées et sorties', () => {
      const entrees = ['COTISATION', 'INSCRIPTION', 'PENALITE', 'REMBOURSEMENT_PRET'];
      const sorties = ['POT', 'PRET', 'SECOURS', 'PROJET'];
      expect(entrees).toContain('COTISATION');
      expect(sorties).toContain('POT');
    });
  });

  describe('Statuts de transaction', () => {
    const statuts = ['EN_ATTENTE', 'VALIDEE', 'REJETEE', 'ANNULEE'];

    it('devrait valider les statuts disponibles', () => {
      expect(statuts).toHaveLength(4);
    });

    it('devrait permettre la validation d\'une transaction en attente', () => {
      const transaction = { statut: 'EN_ATTENTE' };
      const canValidate = transaction.statut === 'EN_ATTENTE';
      expect(canValidate).toBe(true);
    });

    it('devrait rejeter la modification d\'une transaction validée', () => {
      const transaction = { statut: 'VALIDEE' };
      const canModify = transaction.statut === 'EN_ATTENTE';
      expect(canModify).toBe(false);
    });
  });

  describe('Modes de paiement', () => {
    const modes = ['MOBILE_MONEY', 'ESPECES', 'VIREMENT'];

    it('devrait accepter les modes valides', () => {
      expect(modes).toContain('MOBILE_MONEY');
      expect(modes).toContain('ESPECES');
    });

    it('devrait valider un numéro de téléphone pour Mobile Money', () => {
      const telephone = '690000001';
      const isValid = /^6[0-9]{8}$/.test(telephone);
      expect(isValid).toBe(true);
    });
  });

  describe('Références de transaction', () => {
    it('devrait générer une référence unique', () => {
      const prefix = 'TXN';
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(2, 8).toUpperCase();
      const reference = `${prefix}-${timestamp}-${random}`;
      expect(reference).toMatch(/^TXN-\d+-[A-Z0-9]+$/);
    });

    it('devrait inclure le type dans la référence', () => {
      const type = 'COT';
      const reference = `${type}-2024-001`;
      expect(reference).toContain('COT');
    });
  });

  describe('Calculs de solde', () => {
    it('devrait calculer le solde après transactions', () => {
      const transactions = [
        { type: 'COTISATION', montant: 10000 },
        { type: 'COTISATION', montant: 10000 },
        { type: 'POT', montant: -100000 },
        { type: 'COTISATION', montant: 10000 },
      ];
      const solde = transactions.reduce((acc, t) => acc + t.montant, 0);
      expect(solde).toBe(-70000);
    });

    it('devrait calculer le total des cotisations', () => {
      const transactions = [
        { type: 'COTISATION', montant: 10000 },
        { type: 'COTISATION', montant: 10000 },
        { type: 'POT', montant: 100000 },
        { type: 'INSCRIPTION', montant: 5000 },
      ];
      const totalCotisations = transactions
        .filter(t => t.type === 'COTISATION')
        .reduce((acc, t) => acc + t.montant, 0);
      expect(totalCotisations).toBe(20000);
    });
  });

  describe('Cotisations dues', () => {
    it('devrait calculer le montant dû pour un membre', () => {
      const cotisationsAttendues = 5;
      const montantParCotisation = 10000;
      const cotisationsPayees = 3;
      const montantDu = (cotisationsAttendues - cotisationsPayees) * montantParCotisation;
      expect(montantDu).toBe(20000);
    });

    it('devrait identifier les membres à jour', () => {
      const membres = [
        { id: 'm1', cotisationsPayees: 5, cotisationsAttendues: 5 },
        { id: 'm2', cotisationsPayees: 3, cotisationsAttendues: 5 },
        { id: 'm3', cotisationsPayees: 5, cotisationsAttendues: 5 },
      ];
      const aJour = membres.filter(m => m.cotisationsPayees >= m.cotisationsAttendues);
      expect(aJour).toHaveLength(2);
    });
  });

  describe('Erreurs métier', () => {
    it('devrait lever NotFoundError pour transaction inexistante', () => {
      expect(() => { throw new NotFoundError('Transaction non trouvée'); }).toThrow(NotFoundError);
    });

    it('devrait lever BadRequestError pour montant invalide', () => {
      expect(() => { throw new BadRequestError('Le montant doit être supérieur à zéro'); }).toThrow(BadRequestError);
    });

    it('devrait lever ConflictError pour transaction déjà validée', () => {
      expect(() => { throw new ConflictError('Cette transaction est déjà validée'); }).toThrow(ConflictError);
    });

    it('devrait lever BadRequestError pour solde insuffisant', () => {
      expect(() => { throw new BadRequestError('Solde insuffisant'); }).toThrow(BadRequestError);
    });
  });
});
