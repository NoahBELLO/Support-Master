const messageService = require('./message.service');

const create = async (req, res, next) => {
  try {
    const message = await messageService.addMessage(
      { ...req.body, ticketId: req.params.ticketId },
      req.user
    );
    res.status(201).json(message);
  } catch (err) { next(err); }
};

const list = async (req, res, next) => {
  try {
    res.json(await messageService.listMessages(req.params.ticketId, req.user));
  } catch (err) { next(err); }
};

module.exports = { create, list };
