const router = require('express').Router();
const { register, login, me } = require('./auth.controller');
const validate = require('../../middlewares/validate.middleware');
const { verifyToken } = require('../../middlewares/auth.middleware');
const { registerSchema, loginSchema } = require('./auth.validator');

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.get('/me', verifyToken, me);

module.exports = router;
