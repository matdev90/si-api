const { Router } = require('express');
const { create, list, getById, grade, updateStatus } = require('../controllers/incidentController');
const { authenticate, authorize } = require('../middleware/auth');
const { validate, incidentCreateSchema, incidentGradeSchema, incidentStatusSchema } = require('../middleware/validate');
const { auditLog } = require('../middleware/auditLog');

const router = Router();

router.post('/', authenticate, validate(incidentCreateSchema), auditLog('CREATE_INCIDENT', 'incident'), create);
router.get('/', authenticate, list);
router.get('/:id', authenticate, getById);
router.patch('/:id/grade', authenticate, authorize('validator', 'pmkp', 'admin'), validate(incidentGradeSchema), auditLog('GRADE_INCIDENT', 'incident'), grade);
router.patch('/:id/status', authenticate, authorize('pmkp', 'validator', 'admin'), validate(incidentStatusSchema), auditLog('UPDATE_INCIDENT_STATUS', 'incident'), updateStatus);

module.exports = router;
