const service = require('../services/category.service');

module.exports = {
  async list(req, res) {
    const filters = { q: req.query.q };
    res.json(await service.findAll(filters));
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
