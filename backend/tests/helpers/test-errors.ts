/**
 * Utilitaires de test partagés - Classes d'erreur pour les tests unitaires
 * Ces classes sont isolées pour éviter de charger la configuration réelle
 */

export class TestAppError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.name = this.constructor.name;
  }
}

export class TestNotFoundError extends TestAppError {
  constructor(message: string = 'Ressource non trouvée') {
    super(message, 404);
  }
}

export class TestBadRequestError extends TestAppError {
  constructor(message: string = 'Requête invalide') {
    super(message, 400);
  }
}

export class TestConflictError extends TestAppError {
  constructor(message: string = 'Conflit') {
    super(message, 409);
  }
}

export class TestUnauthorizedError extends TestAppError {
  constructor(message: string = 'Non autorisé') {
    super(message, 401);
  }
}

export class TestForbiddenError extends TestAppError {
  constructor(message: string = 'Accès interdit') {
    super(message, 403);
  }
}
