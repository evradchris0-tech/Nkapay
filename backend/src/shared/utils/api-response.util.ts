/**
 * Classe de base pour les reponses API standardisees
 * Assure une structure coherente pour toutes les reponses
 */

export interface ApiResponseData<T> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: ValidationErrorItem[];
  pagination?: PaginationMeta;
}

export interface ValidationErrorItem {
  field: string;
  message: string;
  value?: unknown;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export class ApiResponse {
  /**
   * Genere une reponse de succes
   */
  static success<T>(data: T, message?: string): ApiResponseData<T> {
    return {
      success: true,
      message,
      data,
    };
  }

  /**
   * Genere une reponse de succes avec pagination
   */
  static paginated<T>(
    data: T[],
    pagination: PaginationMeta,
    message?: string
  ): ApiResponseData<T[]> {
    return {
      success: true,
      message,
      data,
      pagination,
    };
  }

  /**
   * Genere une reponse de creation (201)
   */
  static created<T>(data: T, message = 'Ressource creee avec succes'): ApiResponseData<T> {
    return {
      success: true,
      message,
      data,
    };
  }

  /**
   * Genere une reponse d'erreur
   */
  static error(message: string, errors?: ValidationErrorItem[]): ApiResponseData<null> {
    return {
      success: false,
      message,
      errors,
    };
  }

  /**
   * Genere une reponse d'erreur de validation
   */
  static validationError(errors: ValidationErrorItem[]): ApiResponseData<null> {
    return {
      success: false,
      message: 'Erreur de validation des donnees',
      errors,
    };
  }
}
