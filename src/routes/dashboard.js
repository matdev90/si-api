const { Router } = require('express');
const { stats, trends } = require('../controllers/dashboardController');
const { authenticate } = require('../middleware/auth');

const router = Router();

router.get('/stats', authenticate, stats);
router.get('/trends', authenticate, trends);

module.exports = router;
