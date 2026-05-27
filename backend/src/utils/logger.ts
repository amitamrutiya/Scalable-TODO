import winston from 'winston';

const { combine, timestamp, json, errors, printf } = winston.format;

const consoleFormat = printf(({ level, message, timestamp, ...metadata }) => {
  let msg = `${timestamp} [${level.toUpperCase()}]: ${message}`;
  if (Object.keys(metadata).length > 0) {
    msg += ` ${JSON.stringify(metadata)}`;
  }
  return msg;
});

export function getLogger(service: string): winston.Logger {
  return winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    defaultMeta: { service },
    format: combine(
      timestamp(),
      errors({ stack: true }),
      process.env.NODE_ENV === 'production' ? json() : consoleFormat
    ),
    transports: [
      new winston.transports.Console(),
    ],
  });
}

export const logger = getLogger('app');
