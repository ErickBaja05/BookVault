const service = require('../services/book.service');

module.exports = {
  async list(req, res) {
    const filters = {
      q: req.query.q,
      category: req.query.category ?? req.query.cod_categoria,
      author: req.query.author ?? req.query.cod_autor,
      available: req.query.available ?? req.query.solo_disponibles,
    };
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
