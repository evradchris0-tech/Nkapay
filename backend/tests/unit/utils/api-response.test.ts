/**
 * Tests unitaires pour les utilitaires de reponse API
 */
import { ApiResponse } from '../../../src/shared/utils/api-response.util';

describe('ApiResponse', () => {
  describe('success', () => {
    it('should create success response with data', () => {
      const data = { id: '1', name: 'Test' };
      const response = ApiResponse.success(data);

      expect(response.success).toBe(true);
      expect(response.data).toEqual(data);
    });

    it('should create success response with message', () => {
      const response = ApiResponse.success({ id: '1' }, 'Operation reussie');

      expect(response.success).toBe(true);
      expect(response.message).toBe('Operation reussie');
    });
  });

  describe('paginated', () => {
    it('should create paginated response', () => {
      const data = [{ id: '1' }, { id: '2' }];
      const pagination = { page: 1, limit: 10, total: 50, totalPages: 5 };
      const response = ApiResponse.paginated(data, pagination);

      expect(response.success).toBe(true);
      expect(response.data).toHaveLength(2);
      expect(response.pagination).toEqual(pagination);
    });
  });

  describe('created', () => {
    it('should create created response with default message', () => {
      const data = { id: '1' };
      const response = ApiResponse.created(data);

      expect(response.success).toBe(true);
      expect(response.message).toContain('creee');
    });

    it('should create created response with custom message', () => {
      const response = ApiResponse.created({ id: '1' }, 'Tontine creee');

      expect(response.message).toBe('Tontine creee');
    });
  });

  describe('error', () => {
    it('should create error response', () => {
      const response = ApiResponse.error('Erreur survenue');

      expect(response.success).toBe(false);
      expect(response.message).toBe('Erreur survenue');
    });

    it('should create error response with validation errors', () => {
      const errors = [{ field: 'email', message: 'Email requis' }];
      const response = ApiResponse.error('Validation echouee', errors);

      expect(response.errors).toEqual(errors);
    });
  });

  describe('validationError', () => {
    it('should create validation error response', () => {
      const errors = [{ field: 'nom', message: 'Nom requis' }];
      const response = ApiResponse.validationError(errors);

      expect(response.success).toBe(false);
      expect(response.message).toContain('validation');
      expect(response.errors).toEqual(errors);
    });
  });
});