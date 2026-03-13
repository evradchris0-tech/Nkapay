import { PretBuilder } from '../../../src/modules/prets/builders/pret.builder';
import { StatutPret } from '../../../src/modules/prets/entities/pret.entity';

describe('PretBuilder', () => {
    const defaultBuilder = () =>
        new PretBuilder()
            .forMembre('membre-123')
            .atReunion('reunion-456')
            .withCapital(500000)
            .withTaux(0.05)
            .withDuree(6);

    describe('construction basique', () => {
        it('devrait créer un prêt avec les champs obligatoires', () => {
            const result = defaultBuilder().build();

            expect(result.exerciceMembreId).toBe('membre-123');
            expect(result.reunionId).toBe('reunion-456');
            expect(result.montantCapital).toBe(500000);
            expect(result.tauxInteret).toBe(0.05);
            expect(result.dureeMois).toBe(6);
            expect(result.statut).toBe(StatutPret.DEMANDE);
        });
    });

    describe('calcul automatique des intérêts', () => {
        it('devrait calculer les intérêts flat correctement', () => {
            // Formule: capital * taux * durée / 12
            // 500000 * 0.05 * 6 / 12 = 12500
            const result = defaultBuilder().build();

            expect(result.montantInteret).toBe(12500);
            expect(result.montantTotalDu).toBe(512500);
        });

        it('devrait calculer avec un taux de 10% sur 12 mois', () => {
            const result = new PretBuilder()
                .forMembre('m1')
                .atReunion('r1')
                .withCapital(1000000)
                .withTaux(0.10)
                .withDuree(12)
                .build();

            // 1000000 * 0.10 * 12 / 12 = 100000
            expect(result.montantInteret).toBe(100000);
            expect(result.montantTotalDu).toBe(1100000);
        });

        it('devrait avoir un capitalRestant égal au capital initial', () => {
            const result = defaultBuilder().build();
            expect(result.capitalRestant).toBe(result.montantCapital);
        });

        it('devrait calculer avec un taux à 0 (prêt sans intérêt)', () => {
            const result = new PretBuilder()
                .forMembre('m1')
                .atReunion('r1')
                .withCapital(200000)
                .withTaux(0)
                .withDuree(3)
                .build();

            expect(result.montantInteret).toBe(0);
            expect(result.montantTotalDu).toBe(200000);
        });
    });

    describe('chaînage fluide', () => {
        it('devrait supporter le commentaire', () => {
            const result = defaultBuilder()
                .withCommentaire('Prêt pour commerce')
                .build();

            expect(result.commentaire).toBe('Prêt pour commerce');
        });

        it('devrait mettre null si pas de commentaire', () => {
            const result = defaultBuilder().build();
            expect(result.commentaire).toBeNull();
        });
    });

    describe('validations', () => {
        it('devrait lever une erreur si exerciceMembreId manquant', () => {
            expect(() => {
                new PretBuilder()
                    .atReunion('r1')
                    .withCapital(100000)
                    .withTaux(0.05)
                    .withDuree(6)
                    .build();
            }).toThrow('exerciceMembreId requis');
        });

        it('devrait lever une erreur si reunionId manquant', () => {
            expect(() => {
                new PretBuilder()
                    .forMembre('m1')
                    .withCapital(100000)
                    .withTaux(0.05)
                    .withDuree(6)
                    .build();
            }).toThrow('reunionId requis');
        });

        it('devrait lever une erreur si montantCapital manquant', () => {
            expect(() => {
                new PretBuilder()
                    .forMembre('m1')
                    .atReunion('r1')
                    .withTaux(0.05)
                    .withDuree(6)
                    .build();
            }).toThrow('montantCapital requis');
        });

        it('devrait lever une erreur si tauxInteret manquant', () => {
            expect(() => {
                new PretBuilder()
                    .forMembre('m1')
                    .atReunion('r1')
                    .withCapital(100000)
                    .withDuree(6)
                    .build();
            }).toThrow('tauxInteret requis');
        });

        it('devrait lever une erreur si dureeMois manquante', () => {
            expect(() => {
                new PretBuilder()
                    .forMembre('m1')
                    .atReunion('r1')
                    .withCapital(100000)
                    .withTaux(0.05)
                    .build();
            }).toThrow('dureeMois requis');
        });

        it('devrait lever une erreur si capital négatif', () => {
            expect(() => new PretBuilder().withCapital(-1)).toThrow('positif');
        });

        it('devrait lever une erreur si capital est zéro', () => {
            expect(() => new PretBuilder().withCapital(0)).toThrow('positif');
        });

        it('devrait lever une erreur si taux négatif', () => {
            expect(() => new PretBuilder().withTaux(-0.01)).toThrow('négatif');
        });

        it('devrait lever une erreur si durée inférieure à 1 mois', () => {
            expect(() => new PretBuilder().withDuree(0)).toThrow('au moins 1 mois');
        });
    });
});
