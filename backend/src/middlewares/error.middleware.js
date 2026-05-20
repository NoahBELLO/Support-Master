const AppError = require('../utils/AppError');

const errorMiddleware = (err, req, res, next) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ message: err.message });
  }
  console.error(err);
  res.status(500).json({ message: 'Erreur interne du serveur' });
};

module.exports = errorMiddleware;
