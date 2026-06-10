const z = require('zod');

function isZodError(err) {
  return err?.name === 'ZodError' && Array.isArray(err.issues);
}

function validate(schema) {
  return (req, res, next) => {
    try {
      req.validated = schema.parse(req.body);
      next();
    } catch (err) {
      if (isZodError(err)) {
        const errors = err.issues.map(e => ({
          field: e.path?.join('.') || 'unknown',
          message: e.message,
        }));
        return res.status(422).json({ error: 'Validation failed', details: errors });
      }
      next(err);
    }
  };
}

function validateQuery(schema) {
  return (req, res, next) => {
    try {
      req.validatedQuery = schema.parse(req.query);
      next();
    } catch (err) {
      if (isZodError(err)) {
        const errors = err.issues.map(e => ({
          field: e.path?.join('.') || 'unknown',
          message: e.message,
        }));
        return res.status(422).json({ error: 'Invalid query parameters', details: errors });
      }
      next(err);
    }
  };
}

const loginSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(4).max(100),
});

const registerSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(4).max(100),
  name: z.string().min(2).max(100),
  role: z.enum(['pelapor', 'validator', 'pmkp', 'kepala_unit', 'manajemen']),
  unit: z.string().min(2).max(100),
});

const incidentCreateSchema = z.object({
  incident_type: z.enum(['KTD', 'KNC', 'KPC', 'KTC', 'sentinel']),
  incident_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  incident_time: z.string().regex(/^\d{2}:\d{2}$/, 'Time must be HH:MM'),
  location: z.string().min(2).max(200),
  description: z.string().min(10).max(5000),
  consequence: z.string().min(5).max(2000),
  immediate_action: z.string().max(2000).optional(),
  is_anonymous: z.boolean().optional(),
  attachments: z.array(z.string()).max(5).optional(),
});

const incidentGradeSchema = z.object({
  severity: z.enum(['biru', 'hijau', 'kuning', 'merah']),
});

const incidentStatusSchema = z.object({
  status: z.enum(['dilaporkan', 'divalidasi', 'investigasi', 'ditindaklanjuti', 'selesai', 'ditolak']),
});

const investigationCompleteSchema = z.object({
  root_cause: z.string().min(10).max(5000),
  recommendations: z.string().min(10).max(5000),
  action_plan: z.string().max(5000).optional(),
});

module.exports = {
  validate,
  validateQuery,
  loginSchema,
  registerSchema,
  incidentCreateSchema,
  incidentGradeSchema,
  incidentStatusSchema,
  investigationCompleteSchema,
};
