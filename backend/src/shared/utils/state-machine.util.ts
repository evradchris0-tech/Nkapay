import { BadRequestError } from '../errors/app-error';

export interface StateMachineTransition<S> {
    from: S | S[];
    to: S;
    action?: string;
}

export class StateMachine<S extends string> {
    constructor(
        private readonly transitions: StateMachineTransition<S>[],
        private readonly entityName: string = 'Entité'
    ) { }

    /**
     * Vérifie si une transition est possible
     */
    canTransition(from: S, to: S): boolean {
        // Si l'état de départ et d'arrivée sont identiques, c'est autorisé (pas de changement)
        if (from === to) return true;

        return this.transitions.some(t => {
            const matchesFrom = Array.isArray(t.from) ? t.from.includes(from) : t.from === from;
            const matchesTo = t.to === to;
            return matchesFrom && matchesTo;
        });
    }

    /**
     * Valide une transition et lève une erreur si elle est impossible
     */
    assertTransition(from: S, to: S): void {
        if (!this.canTransition(from, to)) {
            throw new BadRequestError(
                `Transition de statut invalide pour ${this.entityName}: ${from} → ${to}`
            );
        }
    }

    /**
     * Récupère les transitions possibles depuis un état donné
     */
    getAvailableTransitions(from: S): S[] {
        return this.transitions
            .filter(t => Array.isArray(t.from) ? t.from.includes(from) : t.from === from)
            .map(t => t.to);
    }
}
