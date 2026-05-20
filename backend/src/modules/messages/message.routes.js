const router = require('express').Router({ mergeParams: true });
const { create, list } = require('./message.controller');
const { verifyToken } = require('../../middlewares/auth.middleware');
const validate = require('../../middlewares/validate.middleware');
const { createSchema } = require('./message.validator');

router.use(verifyToken);

router.post('/', validate(createSchema), create);
router.get('/', list);

module.exports = router;
