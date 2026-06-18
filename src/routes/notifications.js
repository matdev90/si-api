const { Router } = require('express');
const { list, markRead, markAllRead, remove, deleteAll } = require('../controllers/notificationController');
const { authenticate } = require('../middleware/auth');

const router = Router();

router.get('/', authenticate, list);
router.patch('/:id/read', authenticate, markRead);
router.patch('/read-all', authenticate, markAllRead);
router.delete('/:id', authenticate, remove);
router.delete('/', authenticate, deleteAll);

module.exports = router;
