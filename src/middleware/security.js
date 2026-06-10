const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cors = require('cors');

const securityMiddleware = [
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  }),

  cors({
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000', 'http://localhost:5173'],
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 86400,
  }),

  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX || '200'),
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later' },
  }),
];

const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many login attempts, please try again later' },
});

module.exports = { securityMiddleware, authRateLimit };
