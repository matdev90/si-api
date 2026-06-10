const { v4: uuidv4 } = require('uuid');
const { execute } = require('../config/database');

function auditLog(action, entityType) {
  return (req, res, next) => {
    const originalJson = res.json.bind(res);

    res.json = function (body) {
      const entityId = req.params.id || body?.id || null;

      execute(`INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?, ?)`, [
        uuidv4(),
        req.user?.id || null,
        action,
        entityType,
        entityId,
        JSON.stringify({
          method: req.method,
          path: req.originalUrl,
          statusCode: res.statusCode,
          summary: typeof body === 'object' ? Object.keys(body).slice(0, 5).join(',') : 'ok',
        }),
      ]);

      return originalJson(body);
    };

    next();
  };
}

module.exports = { auditLog };
