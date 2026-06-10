const { Router } = require('express');
const { list, exportExcel, exportPDF } = require('../controllers/laporanController');
const { authenticate, authorize } = require('../middleware/auth');

const router = Router();

router.use(authenticate, authorize('pmkp', 'manajemen', 'admin', 'kepala_unit', 'validator'));

router.get('/', list);
router.get('/export/excel', exportExcel);
router.get('/export/pdf', exportPDF);

module.exports = router;
