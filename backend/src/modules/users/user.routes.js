const router = require('express').Router();
const { list, getOne, update, remove } = require('./user.controller');
const { verifyToken, requireRole } = require('../../middlewares/auth.middleware');
const validate = require('../../middlewares/validate.middleware');
const { updateSchema } = require('./user.validator');

router.use(verifyToken, requireRole('admin'));

router.get('/', list);
router.get('/:id', getOne);
router.put('/:id', validate(updateSchema), update);
router.delete('/:id', remove);

module.exports = router;
