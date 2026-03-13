import { EventEmitter } from 'events';

/**
 * EventBus centralisé pour le découplage des modules.
 * Permet d'émettre des événements métier (ex: 'transaction.created')
 * sans que le service émetteur ne connaisse les services qui réagissent.
 */
class EventBus extends EventEmitter {
  private static instance: EventBus;

  private constructor() {
    super();
    this.setMaxListeners(50); // Ajuster selon besoin
  }

  public static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  /**
   * Émet un événement typé
   */
  emitTyped<T>(event: string, data: T): boolean {
    return this.emit(event, data);
  }
}

export const eventBus = EventBus.getInstance();

export enum AppEvents {
  TRANSACTION_CREATED = 'transaction.created',
  TRANSACTION_VALIDATED = 'transaction.validated',
  PRET_DEMANDE = 'pret.demande',
  PRET_ACTIF = 'pret.actif',
  SECOURS_VALIDE = 'secours.valide',
  ADHERENT_APPROUVE = 'adherent.approuve',
}
