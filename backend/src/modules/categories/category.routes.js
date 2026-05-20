const router = require('express').Router();
const { list, create, update, remove } = require('./category.controller');
const { verifyToken, requireRole } = require('../../middlewares/auth.middleware');
const validate = require('../../middlewares/validate.middleware');
const { createSchema, updateSchema } = require('./category.validator');

router.use(verifyToken);

router.get('/', list);
router.post('/', requireRole('admin'), validate(createSchema), create);
router.put('/:id', requireRole('admin'), validate(updateSchema), update);
router.delete('/:id', requireRole('admin'), remove);

module.exports = router;
