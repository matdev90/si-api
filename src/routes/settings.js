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
  hospital_name: z.string().min(2).max(200),
});

const router = Router();

router.get('/', authenticate, getSettings);
router.put('/', authenticate, authorize('admin'), validate(updateSettingsSchema), updateSettings);
router.post('/logo', authenticate, authorize('admin'), upload.single('logo'), uploadLogo);

module.exports = router;
