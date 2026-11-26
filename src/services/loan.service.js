const repository = require('../repositories/loan.repository');

module.exports = {
  // TODO: Add loan-specific business rules before delegating to the repository.
  findAll() {
    return repository.findAll();
  },
  // TODO: Define loan lookup and not-found behavior.
  findById(id) {
    return repository.findById(id);
  },
  // TODO: Validate and create a loan.
  create(data) {
    return repository.create(data);
  },
  // TODO: Validate and update a loan.
  update(id, data) {
    return repository.update(id, data);
  },
  // TODO: Apply loan deletion rules.
  remove(id) {
    return repository.remove(id);
  },
};
