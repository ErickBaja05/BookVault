const service = require('../services/loan.service');

module.exports = {
  async list(_req, res) {
    res.json(await service.findAll());
  },
  async getById(req, res) {
    res.json(await service.findById(req.params.id));
  },
  async create(req, res) {
    res.status(201).json(await service.create(req.body));
  },
  async update(req, res) {
    res.json(await service.update(req.params.id, req.body));
  },
  async remove(req, res) {
    await service.remove(req.params.id);
    res.status(204).end();
  },
};
