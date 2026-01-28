/**
 * Configuration de l'environnement
 * Centralise l'acces aux variables d'environnement avec validation et valeurs par defaut
 */

import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

interface EnvironmentConfig {
  nodeEnv: string;
  port: number;
  apiPrefix: string;

  db: {
    host: string;
    port: number;
    username: string;
    password: string;
    database: string;
    synchronize: boolean;
    logging: boolean;
  };

  jwt: {
    secret: string;
    expiresIn: string;
    refreshExpiresIn: string;
  };

  logging: {
    level: string;
    filePath: string;
  };

  cors: {
    origin: string;
  };

  rateLimit: {
    windowMs: number;
    maxRequests: number;
  };
}

function getEnvString(key: string, defaultValue: string = ''): string {
  return process.env[key] || defaultValue;
}

function getEnvNumber(key: string, defaultValue: number): number {
  const value = process.env[key];
  if (!value) return defaultValue;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

function getEnvBoolean(key: string, defaultValue: boolean): boolean {
  const value = process.env[key];
  if (!value) return defaultValue;
  return value.toLowerCase() === 'true';
}

export const env: EnvironmentConfig = {
  nodeEnv: getEnvString('NODE_ENV', 'development'),
  port: getEnvNumber('PORT', 3000),
  apiPrefix: getEnvString('API_PREFIX', '/api/v1'),

  db: {
    host: getEnvString('DB_HOST', 'localhost'),
    port: getEnvNumber('DB_PORT', 3306),
    username: getEnvString('DB_USERNAME', 'root'),
    password: getEnvString('DB_PASSWORD', ''),
    database: getEnvString('DB_DATABASE', 'nkapay_db'),
    synchronize: getEnvBoolean('DB_SYNCHRONIZE', false),
    logging: getEnvBoolean('DB_LOGGING', true),
  },

  jwt: {
    secret: getEnvString('JWT_SECRET', 'default-secret-change-in-production'),
    expiresIn: getEnvString('JWT_EXPIRES_IN', '1h'),
    refreshExpiresIn: getEnvString('JWT_REFRESH_EXPIRES_IN', '7d'),
  },

  logging: {
    level: getEnvString('LOG_LEVEL', 'debug'),
    filePath: getEnvString('LOG_FILE_PATH', 'logs/app.log'),
  },

  cors: {
    origin: getEnvString('CORS_ORIGIN', 'http://localhost:4200'),
  },

  rateLimit: {
    windowMs: getEnvNumber('RATE_LIMIT_WINDOW_MS', 900000),
    maxRequests: getEnvNumber('RATE_LIMIT_MAX_REQUESTS', 100),
  },
};

export const isDevelopment = env.nodeEnv === 'development';
export const isProduction = env.nodeEnv === 'production';
export const isTest = env.nodeEnv === 'test';
