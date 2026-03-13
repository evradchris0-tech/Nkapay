/**
 * Tests unitaires pour les middlewares tenant (requireOrganisation, requireOrgRole, requireSuperAdmin)
 */

import { Request, Response } from 'express';
import {
  requireOrganisation,
  requireOrgRole,
  requireSuperAdmin,
} from '../../../src/shared/middlewares/tenant.middleware';

function makeReq(user?: any): Request {
  return { user } as any;
}
const res = {} as Response;

describe('requireOrganisation', () => {
  it('appelle next() si user avec organisationId', () => {
    const next = jest.fn();
    requireOrganisation(makeReq({ id: 'u1', organisationId: 'org-1' }), res, next);
    expect(next).toHaveBeenCalledWith(/* nothing */);
    expect(next).toHaveBeenCalledTimes(1);
    expect(next.mock.calls[0]).toHaveLength(0);
  });

  it('appelle next(UnauthorizedError) si pas de user', () => {
    const next = jest.fn();
    requireOrganisation(makeReq(undefined), res, next as any);
    const err: any = next.mock.calls[0][0];
    expect(err).toBeDefined();
    expect(err.statusCode ?? err.status).toBe(401);
  });

  it('appelle next(ForbiddenError) si user sans organisationId', () => {
    const next = jest.fn();
    requireOrganisation(makeReq({ id: 'u1' }), res, next as any);
    const err: any = next.mock.calls[0][0];
    expect(err).toBeDefined();
    expect(err.statusCode ?? err.status).toBe(403);
  });
});

describe('requireOrgRole', () => {
  it('appelle next() si rôle dans la liste', () => {
    const next = jest.fn();
    const middleware = requireOrgRole('ORG_ADMIN', 'ORG_MEMBRE');
    middleware(makeReq({ id: 'u1', orgRole: 'ORG_ADMIN' }), res, next);
    expect(next).toHaveBeenCalledTimes(1);
    expect(next.mock.calls[0]).toHaveLength(0);
  });

  it('appelle next(ForbiddenError) si rôle non autorisé', () => {
    const next = jest.fn();
    const middleware = requireOrgRole('ORG_ADMIN');
    middleware(makeReq({ id: 'u1', orgRole: 'ORG_VIEWER' }), res, next);
    const err: any = next.mock.calls[0][0];
    expect(err.statusCode ?? err.status).toBe(403);
  });

  it('appelle next(ForbiddenError) si aucun orgRole', () => {
    const next = jest.fn();
    const middleware = requireOrgRole('ORG_ADMIN');
    middleware(makeReq({ id: 'u1' }), res, next as any);
    const err: any = next.mock.calls[0][0];
    expect(err.statusCode ?? err.status).toBe(403);
  });

  it('appelle next(UnauthorizedError) si pas de user', () => {
    const next = jest.fn();
    const middleware = requireOrgRole('ORG_ADMIN');
    middleware(makeReq(undefined), res, next as any);
    const err: any = next.mock.calls[0][0];
    expect(err.statusCode ?? err.status).toBe(401);
  });
});

describe('requireSuperAdmin', () => {
  it('appelle next() si estSuperAdmin = true', () => {
    const next = jest.fn();
    requireSuperAdmin(makeReq({ id: 'u1', estSuperAdmin: true }), res, next);
    expect(next).toHaveBeenCalledTimes(1);
    expect(next.mock.calls[0]).toHaveLength(0);
  });

  it('appelle next(ForbiddenError) si estSuperAdmin = false', () => {
    const next = jest.fn();
    requireSuperAdmin(makeReq({ id: 'u1', estSuperAdmin: false }), res, next);
    const err: any = next.mock.calls[0][0];
    expect(err.statusCode ?? err.status).toBe(403);
  });

  it('appelle next(UnauthorizedError) si pas de user', () => {
    const next = jest.fn();
    requireSuperAdmin(makeReq(undefined), res, next as any);
    const err: any = next.mock.calls[0][0];
    expect(err.statusCode ?? err.status).toBe(401);
  });
});
