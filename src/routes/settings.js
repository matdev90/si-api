const { Router } = require('express');
const multer = require('multer');
const { getSettings, updateSettings, uploadLogo } = require('../controllers/settingsController');
const { authenticate, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { z } = require('zod');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PNG, JPG, and SVG files are allowed'), false);
    }
  },
});

const updateSettingsSchema = z.object({
  hospital_name: z.string().min(2).max(200).optional(),
  hospital_ownership: z.string().max(50).optional(),
  hospital_type: z.string().max(50).optional(),
  hospital_class: z.string().max(10).optional(),
  hospital_bed_capacity: z.string().max(10).optional(),
  hospital_province: z.string().max(50).optional(),
  hospital_code: z.string().max(20).optional(),
});

const router = Router();

router.get('/public', getSettings);
router.get('/', authenticate, getSettings);
router.put('/', authenticate, authorize('admin'), validate(updateSettingsSchema), updateSettings);
router.post('/logo', authenticate, authorize('admin'), upload.single('logo'), uploadLogo);

module.exports = router;
