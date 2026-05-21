const authService = require('./auth.service');

const register = async (req, res, next) => {
  try {
    const result = await authService.register(req.body);
    res.status(201).json(result);
  } catch (err) { next(err); }
};

const login = async (req, res, next) => {
  try {
    const result = await authService.login(req.body);
    console.log(JSON.stringify({ event: 'LOGIN_SUCCESS', email: req.body.email, role: result.user.role }));
    res.json(result);
  } catch (err) {
    console.log(JSON.stringify({ event: 'LOGIN_FAILED', email: req.body.email, reason: err.message }));
    next(err);
  }
};

const me = async (req, res, next) => {
  try {
    const user = await authService.me(req.user.id);
    res.json(user);
  } catch (err) { next(err); }
};

module.exports = { register, login, me };
