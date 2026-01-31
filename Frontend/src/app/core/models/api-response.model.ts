/**
 * API Response Models
 */

// Standard API response wrapper
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: ApiError[];
}

// API error details
export interface ApiError {
  field?: string;
  message: string;
  code?: string;
}

import { PaginationState } from './pagination.model';

// Paginated API response
export interface PaginatedResponse<T = any> {
  success: boolean;
  data: T[];
  pagination: PaginationState;
}
