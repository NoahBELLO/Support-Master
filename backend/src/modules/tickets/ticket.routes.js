const router = require('express').Router();
const { create, list, getOne, update, claim, remove } = require('./ticket.controller');
const { verifyToken, requireRole } = require('../../middlewares/auth.middleware');
const validate = require('../../middlewares/validate.middleware');
const { createSchema, updateSchema } = require('./ticket.validator');

router.use(verifyToken);

router.post('/', validate(createSchema), create);
router.get('/', list);
router.get('/:id', getOne);
router.put('/:id', validate(updateSchema), update);
router.post('/:id/claim', requireRole('agent', 'admin'), claim);
router.delete('/:id', requireRole('admin'), remove);

module.exports = router;
