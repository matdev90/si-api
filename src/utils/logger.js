const pino = require('pino');
const path = require('node:path');
const fs = require('node:fs');

const logDir = path.resolve(__dirname, '../../logs');
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });

const isProduction = process.env.NODE_ENV === 'production';

const transport = isProduction
  ? {
      targets: [
        {
          target: 'pino/file',
          options: { destination: path.join(logDir, 'app.log'), mkdir: true },
        },
        {
          target: 'pino/file',
          options: { destination: path.join(logDir, 'error.log'), level: 'error', mkdir: true },
        },
      ],
    }
  : {
      target: 'pino-pretty',
      options: { colorize: true, translateTime: 'SYS:standard' },
    };

const logger = pino({
  level: process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug'),
  transport,
});

module.exports = logger;
