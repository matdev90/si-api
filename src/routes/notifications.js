const { Router } = require('express');
const { list, markRead, markAllRead } = require('../controllers/notificationController');
const { authenticate } = require('../middleware/auth');

const router = Router();

router.get('/', authenticate, list);
router.patch('/:id/read', authenticate, markRead);
router.patch('/read-all', authenticate, markAllRead);

module.exports = router;
