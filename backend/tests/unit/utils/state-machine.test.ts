import { StateMachine } from '../../../src/shared/utils/state-machine.util';

// Mock BadRequestError depuis shared
jest.mock('../../../src/shared/errors/app-error', () => {
    class BadRequestError extends Error {
        statusCode = 400;
        constructor(message: string) {
            super(message);
            this.name = 'BadRequestError';
        }
    }
    return { BadRequestError, NotFoundError: BadRequestError, ConflictError: BadRequestError };
});

enum TestStatut {
    BROUILLON = 'brouillon',
    SOUMIS = 'soumis',
    VALIDE = 'valide',
    REJETE = 'rejete',
    ANNULE = 'annule',
}

describe('StateMachine', () => {
    let machine: StateMachine<TestStatut>;

    beforeEach(() => {
        machine = new StateMachine<TestStatut>([
            { from: TestStatut.BROUILLON, to: TestStatut.SOUMIS, action: 'soumettre' },
            { from: TestStatut.SOUMIS, to: TestStatut.VALIDE, action: 'valider' },
            { from: TestStatut.SOUMIS, to: TestStatut.REJETE, action: 'rejeter' },
            { from: TestStatut.VALIDE, to: TestStatut.ANNULE, action: 'annuler' },
        ], 'TestEntity');
    });

    describe('canTransition', () => {
        it('devrait autoriser les transitions valides', () => {
            expect(machine.canTransition(TestStatut.BROUILLON, TestStatut.SOUMIS)).toBe(true);
            expect(machine.canTransition(TestStatut.SOUMIS, TestStatut.VALIDE)).toBe(true);
            expect(machine.canTransition(TestStatut.SOUMIS, TestStatut.REJETE)).toBe(true);
            expect(machine.canTransition(TestStatut.VALIDE, TestStatut.ANNULE)).toBe(true);
        });

        it('devrait refuser les transitions invalides', () => {
            expect(machine.canTransition(TestStatut.BROUILLON, TestStatut.VALIDE)).toBe(false);
            expect(machine.canTransition(TestStatut.REJETE, TestStatut.SOUMIS)).toBe(false);
            expect(machine.canTransition(TestStatut.ANNULE, TestStatut.BROUILLON)).toBe(false);
            expect(machine.canTransition(TestStatut.VALIDE, TestStatut.SOUMIS)).toBe(false);
        });

        it('devrait autoriser la transition vers le même état', () => {
            expect(machine.canTransition(TestStatut.BROUILLON, TestStatut.BROUILLON)).toBe(true);
            expect(machine.canTransition(TestStatut.SOUMIS, TestStatut.SOUMIS)).toBe(true);
        });
    });

    describe('assertTransition', () => {
        it('ne devrait pas lever d\'erreur pour une transition valide', () => {
            expect(() => machine.assertTransition(TestStatut.BROUILLON, TestStatut.SOUMIS)).not.toThrow();
        });

        it('devrait lever une erreur pour une transition invalide', () => {
            expect(() => machine.assertTransition(TestStatut.BROUILLON, TestStatut.VALIDE)).toThrow();
        });

        it('devrait inclure le nom de l\'entité dans le message d\'erreur', () => {
            try {
                machine.assertTransition(TestStatut.BROUILLON, TestStatut.VALIDE);
                fail('Should have thrown');
            } catch (error: any) {
                expect(error.message).toContain('TestEntity');
                expect(error.message).toContain('brouillon');
                expect(error.message).toContain('valide');
            }
        });
    });

    describe('getAvailableTransitions', () => {
        it('devrait retourner les transitions disponibles depuis SOUMIS', () => {
            const available = machine.getAvailableTransitions(TestStatut.SOUMIS);
            expect(available).toContain(TestStatut.VALIDE);
            expect(available).toContain(TestStatut.REJETE);
            expect(available).toHaveLength(2);
        });

        it('devrait retourner une seule transition depuis BROUILLON', () => {
            const available = machine.getAvailableTransitions(TestStatut.BROUILLON);
            expect(available).toEqual([TestStatut.SOUMIS]);
        });

        it('devrait retourner un tableau vide pour un état terminal', () => {
            const available = machine.getAvailableTransitions(TestStatut.REJETE);
            expect(available).toEqual([]);
        });
    });

    describe('transitions multi-sources (from: array)', () => {
        it('devrait supporter un tableau dans from', () => {
            const multiMachine = new StateMachine<TestStatut>([
                { from: [TestStatut.BROUILLON, TestStatut.REJETE], to: TestStatut.SOUMIS },
            ], 'MultiTest');

            expect(multiMachine.canTransition(TestStatut.BROUILLON, TestStatut.SOUMIS)).toBe(true);
            expect(multiMachine.canTransition(TestStatut.REJETE, TestStatut.SOUMIS)).toBe(true);
            expect(multiMachine.canTransition(TestStatut.VALIDE, TestStatut.SOUMIS)).toBe(false);
        });
    });
});
