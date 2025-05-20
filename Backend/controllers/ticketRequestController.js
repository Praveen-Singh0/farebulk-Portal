const TicketRequest = require('../models/TicketRequest');

exports.getAll = async (req, res) => {
  const tickets = await TicketRequest.find();
  res.json(tickets);
};

exports.create = async (req, res) => {
  const ticket = new TicketRequest(req.body);
  await ticket.save();
  res.status(201).json(ticket);
};

exports.updateStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const ticket = await TicketRequest.findByIdAndUpdate(id, { status }, { new: true });
  res.json(ticket);
}; 