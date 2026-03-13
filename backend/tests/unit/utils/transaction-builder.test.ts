import { TransactionBuilder } from '../../../src/modules/transactions/builders/transaction.builder';
import { TypeTransaction, StatutTransaction, ModeCreationTransaction } from '../../../src/modules/transactions/entities/transaction.entity';

describe('TransactionBuilder', () => {
    describe('construction basique', () => {
        it('devrait créer une transaction avec les champs obligatoires', () => {
            const result = new TransactionBuilder(TypeTransaction.COTISATION)
                .withMontant(25000)
                .build();

            expect(result.typeTransaction).toBe(TypeTransaction.COTISATION);
            expect(result.montant).toBe(25000);
            expect(result.statut).toBe(StatutTransaction.BROUILLON);
            expect(result.modeCreation).toBe(ModeCreationTransaction.MANUEL);
            expect(result.autoSoumis).toBe(false);
            expect(result.reference).toMatch(/^COT-/);
        });

        it('devrait générer une référence unique par appel', () => {
            const b1 = new TransactionBuilder(TypeTransaction.COTISATION).withMontant(100).build();
            const b2 = new TransactionBuilder(TypeTransaction.COTISATION).withMontant(100).build();
            expect(b1.reference).not.toBe(b2.reference);
        });
    });

    describe('chaînage fluide', () => {
        it('devrait supporter tous les champs optionnels', () => {
            const result = new TransactionBuilder(TypeTransaction.EPARGNE)
                .forMembre('membre-123')
                .atReunion('reunion-456')
                .withMontant(50000)
                .withDescription('Épargne mensuelle')
                .forProjet('projet-789')
                .creePar('user-1', 'em-1')
                .withModeCreation(ModeCreationTransaction.AUTOMATIQUE)
                .build();

            expect(result.exerciceMembreId).toBe('membre-123');
            expect(result.reunionId).toBe('reunion-456');
            expect(result.montant).toBe(50000);
            expect(result.description).toBe('Épargne mensuelle');
            expect(result.projetId).toBe('projet-789');
            expect(result.creeParUtilisateurId).toBe('user-1');
            expect(result.creeParExerciceMembreId).toBe('em-1');
            expect(result.modeCreation).toBe(ModeCreationTransaction.AUTOMATIQUE);
        });
    });

    describe('autoSoumettre', () => {
        it('devrait changer le statut en SOUMIS et définir soumisLe', () => {
            const result = new TransactionBuilder(TypeTransaction.COTISATION)
                .withMontant(25000)
                .autoSoumettre()
                .build();

            expect(result.statut).toBe(StatutTransaction.SOUMIS);
            expect(result.autoSoumis).toBe(true);
            expect(result.soumisLe).toBeInstanceOf(Date);
        });

        it('devrait rester en BROUILLON sans autoSoumettre', () => {
            const result = new TransactionBuilder(TypeTransaction.COTISATION)
                .withMontant(25000)
                .build();

            expect(result.statut).toBe(StatutTransaction.BROUILLON);
            expect(result.soumisLe).toBeNull();
        });
    });

    describe('validations', () => {
        it('devrait lever une erreur si montant manquant', () => {
            expect(() => {
                new TransactionBuilder(TypeTransaction.COTISATION).build();
            }).toThrow('montant requis');
        });

        it('devrait lever une erreur si montant négatif', () => {
            expect(() => {
                new TransactionBuilder(TypeTransaction.COTISATION).withMontant(-100);
            }).toThrow('positif');
        });

        it('devrait lever une erreur si montant est zéro', () => {
            expect(() => {
                new TransactionBuilder(TypeTransaction.COTISATION).withMontant(0);
            }).toThrow('positif');
        });
    });

    describe('préfixes de référence', () => {
        const cases: [TypeTransaction, string][] = [
            [TypeTransaction.INSCRIPTION, 'INS-'],
            [TypeTransaction.COTISATION, 'COT-'],
            [TypeTransaction.EPARGNE, 'EPG-'],
            [TypeTransaction.POT, 'POT-'],
            [TypeTransaction.SECOURS, 'SEC-'],
            [TypeTransaction.PENALITE, 'PEN-'],
        ];

        test.each(cases)('type %s devrait avoir le préfixe %s', (type, prefix) => {
            const result = new TransactionBuilder(type).withMontant(1000).build();
            expect(result.reference).toMatch(new RegExp(`^${prefix}`));
        });
    });

    describe('nullification des optionnels', () => {
        it('devrait mettre à null les champs non définis', () => {
            const result = new TransactionBuilder(TypeTransaction.COTISATION)
                .withMontant(25000)
                .build();

            expect(result.reunionId).toBeNull();
            expect(result.exerciceMembreId).toBeNull();
            expect(result.projetId).toBeNull();
            expect(result.description).toBeNull();
            expect(result.creeParUtilisateurId).toBeNull();
            expect(result.creeParExerciceMembreId).toBeNull();
        });
    });
});
