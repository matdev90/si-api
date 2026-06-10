const { Router } = require('express');
const { exportExcel, exportPDF } = require('../controllers/exportController');
const { authenticate, authorize } = require('../middleware/auth');

const router = Router();

router.get('/excel', authenticate, authorize('pmkp', 'manajemen', 'admin', 'kepala_unit'), exportExcel);
router.get('/pdf', authenticate, authorize('pmkp', 'manajemen', 'admin', 'kepala_unit'), exportPDF);

module.exports = router;
