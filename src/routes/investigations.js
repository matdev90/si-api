const { Router } = require('express');
const { complete, list, getById } = require('../controllers/investigationController');
const { authenticate, authorize } = require('../middleware/auth');
const { validate, investigationCompleteSchema } = require('../middleware/validate');
const { auditLog } = require('../middleware/auditLog');

const router = Router();

router.get('/', authenticate, list);
router.get('/:id', authenticate, getById);
router.patch('/:id/complete', authenticate, authorize('pmkp', 'admin'), validate(investigationCompleteSchema), auditLog('COMPLETE_INVESTIGATION', 'investigation'), complete);

module.exports = router;
