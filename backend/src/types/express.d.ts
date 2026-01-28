/**
 * Declarations de types personnalises pour l'application
 * Etend les types existants et definit les interfaces globales
 */

import { JwtPayload } from '../shared/middlewares/auth.middleware';

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export {};
