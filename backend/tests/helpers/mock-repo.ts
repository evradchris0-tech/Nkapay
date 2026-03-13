/**
 * Helpers pour mocker les repositories TypeORM dans les tests unitaires
 */

export function createMockRepo() {
  const qb = {
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orWhere: jest.fn().mockReturnThis(),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    leftJoin: jest.fn().mockReturnThis(),
    innerJoin: jest.fn().mockReturnThis(),
    innerJoinAndSelect: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    addGroupBy: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    offset: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    getOne: jest.fn(),
    getMany: jest.fn(),
    getManyAndCount: jest.fn(),
    getRawAndEntities: jest.fn(),
    getRawMany: jest.fn(),
    getCount: jest.fn(),
    execute: jest.fn(),
  };

  return {
    findOne: jest.fn(),
    find: jest.fn(),
    findAndCount: jest.fn(),
    findBy: jest.fn(),
    create: jest.fn((data: any) => ({ ...data })),
    save: jest.fn((data: any) => Promise.resolve({ id: 'uuid-mock', ...data })),
    update: jest.fn(),
    delete: jest.fn(),
    remove: jest.fn(),
    count: jest.fn(),
    softDelete: jest.fn(),
    restore: jest.fn(),
    createQueryBuilder: jest.fn().mockReturnValue(qb),
    manager: {
      save: jest.fn((data: any) => Promise.resolve({ id: 'uuid-mock', ...data })),
      create: jest.fn((_entity: any, data: any) => ({ ...data })),
      findOne: jest.fn(),
      find: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      query: jest.fn(),
    },
  };
}

export type MockRepo = ReturnType<typeof createMockRepo>;

/**
 * Crée un mock de AppDataSource distribuant les repos par nom d'entité
 */
export function createMockDataSource(
  repos: Record<string, MockRepo> = {}
) {
  const defaultRepo = createMockRepo();

  const mockQR = {
    connect: jest.fn(),
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    rollbackTransaction: jest.fn(),
    release: jest.fn(),
    manager: {
      save: jest.fn((data: any) => Promise.resolve({ id: 'uuid-mock', ...data })),
      create: jest.fn((_entity: any, data: any) => ({ ...data })),
      findOne: jest.fn(),
      find: jest.fn(),
      query: jest.fn(),
    },
  };

  return {
    getRepository: jest.fn((entity: any) => {
      const name = typeof entity === 'string' ? entity : entity?.name ?? String(entity);
      return repos[name] ?? defaultRepo;
    }),
    createQueryRunner: jest.fn().mockReturnValue(mockQR),
    transaction: jest.fn((fn: any) => fn(mockQR.manager)),
    query: jest.fn(),
    isInitialized: true,
    _defaultRepo: defaultRepo,
    _mockQR: mockQR,
  };
}

export type MockDataSource = ReturnType<typeof createMockDataSource>;

/**
 * Mock standard des erreurs applicatives
 */
export const mockAppErrors = {
  NotFoundError: class NotFoundError extends Error {
    statusCode = 404;
    constructor(message: string) {
      super(message);
      this.name = 'NotFoundError';
    }
  },
  BadRequestError: class BadRequestError extends Error {
    statusCode = 400;
    constructor(message: string) {
      super(message);
      this.name = 'BadRequestError';
    }
  },
  ConflictError: class ConflictError extends Error {
    statusCode = 409;
    constructor(message: string) {
      super(message);
      this.name = 'ConflictError';
    }
  },
  UnauthorizedError: class UnauthorizedError extends Error {
    statusCode = 401;
    constructor(message: string) {
      super(message);
      this.name = 'UnauthorizedError';
    }
  },
  ForbiddenError: class ForbiddenError extends Error {
    statusCode = 403;
    constructor(message: string) {
      super(message);
      this.name = 'ForbiddenError';
    }
  },
  ValidationError: class ValidationError extends Error {
    statusCode = 422;
    constructor(message: string) {
      super(message);
      this.name = 'ValidationError';
    }
  },
};
