import { eventBus, AppEvents } from '../../../src/shared/utils/event-bus.util';

describe('EventBus', () => {
    afterEach(() => {
        eventBus.removeAllListeners();
    });

    it('devrait être un singleton', () => {
        // Vérifier que deux imports retournent la même instance
        const { eventBus: bus1 } = require('../../../src/shared/utils/event-bus.util');
        const { eventBus: bus2 } = require('../../../src/shared/utils/event-bus.util');
        expect(bus1).toBe(bus2);
    });

    describe('emit / on', () => {
        it('devrait émettre et recevoir un événement', (done) => {
            const testData = { id: '123', montant: 25000 };

            eventBus.on(AppEvents.TRANSACTION_CREATED, (data: any) => {
                expect(data).toEqual(testData);
                done();
            });

            eventBus.emit(AppEvents.TRANSACTION_CREATED, testData);
        });

        it('devrait supporter plusieurs listeners sur le même événement', () => {
            let count = 0;

            eventBus.on(AppEvents.TRANSACTION_VALIDATED, () => count++);
            eventBus.on(AppEvents.TRANSACTION_VALIDATED, () => count++);

            eventBus.emit(AppEvents.TRANSACTION_VALIDATED, {});

            expect(count).toBe(2);
        });

        it('ne devrait pas déclencher de listener pour un événement différent', () => {
            let called = false;

            eventBus.on(AppEvents.PRET_DEMANDE, () => {
                called = true;
            });

            eventBus.emit(AppEvents.TRANSACTION_CREATED, {});

            expect(called).toBe(false);
        });
    });

    describe('emitTyped', () => {
        it('devrait émettre un événement typé', (done) => {
            interface TestPayload { id: string; montant: number }

            eventBus.on(AppEvents.SECOURS_VALIDE, (data: TestPayload) => {
                expect(data.id).toBe('abc');
                expect(data.montant).toBe(50000);
                done();
            });

            eventBus.emitTyped<TestPayload>(AppEvents.SECOURS_VALIDE, {
                id: 'abc',
                montant: 50000,
            });
        });
    });

    describe('AppEvents enum', () => {
        it('devrait contenir les événements métier attendus', () => {
            expect(AppEvents.TRANSACTION_CREATED).toBe('transaction.created');
            expect(AppEvents.TRANSACTION_VALIDATED).toBe('transaction.validated');
            expect(AppEvents.PRET_DEMANDE).toBe('pret.demande');
            expect(AppEvents.PRET_ACTIF).toBe('pret.actif');
            expect(AppEvents.SECOURS_VALIDE).toBe('secours.valide');
            expect(AppEvents.ADHERENT_APPROUVE).toBe('adherent.approuve');
        });
    });
});
