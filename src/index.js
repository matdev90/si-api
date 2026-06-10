const path = require('node:path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const { z } = require('zod');

const envSchema = z.object({
  PORT: z.string().default('3000'),
  HOST: z.string().default('0.0.0.0'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  JWT_SECRET: z.string().min(10, 'JWT_SECRET must be at least 10 characters'),
  JWT_EXPIRES_IN: z.string().default('8h'),
  DB_PATH: z.string().default('./data/si-api.db'),
  CORS_ORIGIN: z.string().optional(),
  RATE_LIMIT_MAX: z.string().default('200'),
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).optional(),
});

const envResult = envSchema.safeParse(process.env);
if (!envResult.success) {
  console.error('Invalid environment configuration:');
  envResult.error.errors.forEach(e => console.error(`  - ${e.path.join('.')}: ${e.message}`));
  process.exit(1);
}

const express = require('express');
const { securityMiddleware, authRateLimit } = require('./middleware/security');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const routes = require('./routes');
const { getDatabase, closeDatabase } = require('./config/database');
const logger = require('./utils/logger');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(securityMiddleware);
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

if (process.env.NODE_ENV === 'production') {
  const frontendDist = path.resolve(__dirname, '../frontend/dist');
  app.use(express.static(frontendDist));
}

app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    const level = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';
    logger[level]({
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      userId: req.user?.id || '-',
    }, `${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`);
  });
  next();
});

app.use('/api/v1/auth/login', authRateLimit);

app.use('/api/v1', routes);

if (process.env.NODE_ENV === 'production') {
  const frontendDist = path.resolve(__dirname, '../frontend/dist');
  const frontendIndex = path.join(frontendDist, 'index.html');
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) return next();
    res.sendFile(frontendIndex, err => { if (err) next(err); });
  });
}

app.use(notFoundHandler);
app.use(errorHandler);

async function start() {
  try {
    const { execSync } = require('node:child_process');
    try {
      execSync(`node ${path.resolve(__dirname, 'config/migrate.js')}`, { stdio: 'pipe' });
      logger.info('Auto-migration completed');
    } catch {
      logger.warn('Migration skipped or failed (non-fatal)');
    }

    await getDatabase();
    logger.info('Database connected');

    const HOST = process.env.HOST || '0.0.0.0';
    app.listen(PORT, HOST, () => {
      logger.info(`SI-API server running on ${HOST}:${PORT} (${process.env.NODE_ENV})`);
    });
  } catch (err) {
    logger.error({ err }, 'Failed to start server');
    process.exit(1);
  }
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

function shutdown() {
  logger.info('Shutting down gracefully...');
  closeDatabase();
  process.exit(0);
}

start();
