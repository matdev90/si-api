const { Router } = require('express');
const { login, register, me, changePassword } = require('../controllers/authController');
const { authenticate, authorize } = require('../middleware/auth');
const { validate, loginSchema, registerSchema, changePasswordSchema } = require('../middleware/validate');
const { auditLog } = require('../middleware/auditLog');

const router = Router();

router.post('/login', validate(loginSchema), auditLog('LOGIN', 'user'), login);
router.post('/register', authenticate, authorize('admin'), validate(registerSchema), auditLog('REGISTER', 'user'), register);
router.patch('/password', authenticate, validate(changePasswordSchema), auditLog('CHANGE_PASSWORD', 'user'), changePassword);
router.get('/me', authenticate, me);

module.exports = router;
