const { Router } = require('express');
const {
  listRuangan, getRuangan, createRuangan, updateRuangan, deleteRuangan,
  listUsers, getUser, createUser, updateUser, deleteUser,
} = require('../controllers/masterController');
const { authenticate, authorize } = require('../middleware/auth');
const { validate, ruanganSchema, createUserSchema, updateUserSchema } = require('../middleware/validate');

const router = Router();

router.use(authenticate, authorize('admin'));

router.get('/ruangan', listRuangan);
router.get('/ruangan/:id', getRuangan);
router.post('/ruangan', validate(ruanganSchema), createRuangan);
router.patch('/ruangan/:id', validate(ruanganSchema), updateRuangan);
router.delete('/ruangan/:id', deleteRuangan);

router.get('/users', listUsers);
router.get('/users/:id', getUser);
router.post('/users', validate(createUserSchema), createUser);
router.patch('/users/:id', validate(updateUserSchema), updateUser);
router.delete('/users/:id', deleteUser);

module.exports = router;
