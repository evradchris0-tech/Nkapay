/**
 * Configuration du logger Winston
 * Gere les logs applicatifs avec rotation et formatage personnalise
 */

import winston from 'winston';
import path from 'path';
import { env, isDevelopment } from '../../config';

const logDir = path.dirname(env.logging.filePath);

const customFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    let log = `${timestamp} [${level.toUpperCase()}] ${message}`;
    if (Object.keys(meta).length > 0) {
      log += ` ${JSON.stringify(meta)}`;
    }
    if (stack) {
      log += `\n${stack}`;
    }
    return log;
  })
);

const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let log = `${timestamp} ${level}: ${message}`;
    if (Object.keys(meta).length > 0 && isDevelopment) {
      log += ` ${JSON.stringify(meta, null, 2)}`;
    }
    return log;
  })
);

const transports: winston.transport[] = [
  new winston.transports.Console({
    format: consoleFormat,
  }),
];

// Ajout du transport fichier en production
if (!isDevelopment) {
  transports.push(
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      format: customFormat,
      maxsize: 10 * 1024 * 1024, // 10 MB
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: env.logging.filePath,
      format: customFormat,
      maxsize: 10 * 1024 * 1024,
      maxFiles: 10,
    })
  );
}

export const logger = winston.createLogger({
  level: env.logging.level,
  defaultMeta: { service: 'nkapay-api' },
  transports,
  exitOnError: false,
});

// Interception des exceptions non gerees
logger.exceptions.handle(
  new winston.transports.Console({ format: consoleFormat }),
  new winston.transports.File({
    filename: path.join(logDir, 'exceptions.log'),
    format: customFormat,
  })
);
