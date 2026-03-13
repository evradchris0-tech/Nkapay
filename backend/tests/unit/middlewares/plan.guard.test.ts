/**
 * Tests unitaires pour planGuard middleware
 */

const mockOrgFindOne = jest.fn();

jest.mock('../../../src/config', () => ({
  AppDataSource: {
    getRepository: jest.fn(() => ({ findOne: mockOrgFindOne })),
    isInitialized: true,
  },
}));

import { Request, Response } from 'express';
import { planGuard } from '../../../src/shared/middlewares/plan.guard';

function makeReq(organisationId?: string): Request {
  return { user: organisationId ? { organisationId } : {} } as any;
}

const res = {} as Response;

function makeOrgWithPlan(limit: number) {
  return {
    id: 'org-uuid-1',
    planAbonnement: {
      id: 'plan-uuid-1',
      libelle: 'Gratuit',
      maxTontines: limit,
      maxMembreParTontine: limit,
      maxExercicesParTontine: limit,
    },
  };
}

describe('planGuard', () => {
  beforeEach(() => jest.clearAllMocks());

  it('appelle next() si pas d\'organisationId (laisse passer)', async () => {
    const next = jest.fn();
    const guard = planGuard('maxTontines', jest.fn().mockResolvedValue(0));
    await guard(makeReq(undefined), res, next as any);
    expect(next).toHaveBeenCalledWith();
  });

  it('appelle next() si org ou plan introuvable', async () => {
    const next = jest.fn();
    mockOrgFindOne.mockResolvedValue(null);
    const guard = planGuard('maxTontines', jest.fn().mockResolvedValue(99));
    await guard(makeReq('org-uuid-1'), res, next as any);
    expect(next).toHaveBeenCalledWith();
  });

  it('appelle next() si limit = -1 (illimité)', async () => {
    const next = jest.fn();
    mockOrgFindOne.mockResolvedValue(makeOrgWithPlan(-1));
    const countFn = jest.fn().mockResolvedValue(999);
    const guard = planGuard('maxTontines', countFn);
    await guard(makeReq('org-uuid-1'), res, next as any);
    expect(countFn).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith();
  });

  it('appelle next() si count < limit', async () => {
    const next = jest.fn();
    mockOrgFindOne.mockResolvedValue(makeOrgWithPlan(5));
    const countFn = jest.fn().mockResolvedValue(3);
    const guard = planGuard('maxTontines', countFn);
    await guard(makeReq('org-uuid-1'), res, next as any);
    expect(next).toHaveBeenCalledWith();
    expect(next.mock.calls[0]).toHaveLength(0);
  });

  it('appelle next(ForbiddenError) si count >= limit', async () => {
    const next = jest.fn();
    mockOrgFindOne.mockResolvedValue(makeOrgWithPlan(3));
    const countFn = jest.fn().mockResolvedValue(3);
    const guard = planGuard('maxTontines', countFn);
    await guard(makeReq('org-uuid-1'), res, next as any);
    const err: any = next.mock.calls[0][0];
    expect(err).toBeDefined();
    expect(err.statusCode ?? err.status).toBe(403);
    expect(err.message).toContain('Limite atteinte');
  });

  it('appelle next(ForbiddenError) si count > limit (dépassement)', async () => {
    const next = jest.fn();
    mockOrgFindOne.mockResolvedValue(makeOrgWithPlan(2));
    const countFn = jest.fn().mockResolvedValue(5);
    const guard = planGuard('maxMembreParTontine', countFn);
    await guard(makeReq('org-uuid-1'), res, next as any);
    const err: any = next.mock.calls[0][0];
    expect(err.statusCode ?? err.status).toBe(403);
  });
});
