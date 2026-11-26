const service = require('../services/loan.service');

module.exports = {
  async list(req, res) {
    const filters = {
      status: req.query.status ?? req.query.estado,
      cedula: req.query.cedula ?? req.query.cedula_cliente,
      isbn: req.query.isbn,
      q: req.query.q,
    };
    res.json(await service.findAll(filters));
  },
  async getById(req, res) {
    res.json(await service.findById(req.params.id));
  },
  async create(req, res) {
    res.status(201).json(await service.create(req.body));
  },
  async returnLoan(req, res) {
    res.json(await service.returnLoan(req.params.id, req.body));
  },
  async update(req, res) {
    res.json(await service.update(req.params.id, req.body));
  },
  async remove(req, res) {
    await service.remove(req.params.id);
    res.status(204).end();
  },
};
