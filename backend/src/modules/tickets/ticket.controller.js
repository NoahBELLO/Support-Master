const ticketService = require('./ticket.service');

const claim = async (req, res, next) => {
  try {
    res.json(await ticketService.claimTicket(req.params.id, req.user));
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    res.status(201).json(await ticketService.createTicket(req.body, req.user));
  } catch (err) { next(err); }
};

const list = async (req, res, next) => {
  try {
    res.json(await ticketService.listTickets(req.user, req.query));
  } catch (err) { next(err); }
};

const getOne = async (req, res, next) => {
  try {
    res.json(await ticketService.getTicket(req.params.id, req.user));
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    res.json(await ticketService.updateTicket(req.params.id, req.body, req.user));
  } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try {
    await ticketService.deleteTicket(req.params.id);
    res.status(204).send();
  } catch (err) { next(err); }
};

module.exports = { create, list, getOne, update, claim, remove };
