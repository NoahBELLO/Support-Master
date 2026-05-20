const Joi = require('joi');

const createSchema = Joi.object({
  content: Joi.string().min(1).required(),
  isInternal: Joi.boolean().default(false),
});

module.exports = { createSchema };
