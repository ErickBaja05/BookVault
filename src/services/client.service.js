const repository = require('../repositories/client.repository');

module.exports = {
  // TODO: Add client-specific business rules before delegating to the repository.
  findAll() {
    return repository.findAll();
  },
  // TODO: Define client lookup and not-found behavior.
  findById(id) {
    return repository.findById(id);
  },
  // TODO: Validate and create a client.
  create(data) {
    return repository.create(data);
  },
  // TODO: Validate and update a client.
  update(id, data) {
    return repository.update(id, data);
  },
  // TODO: Apply client deletion rules.
  remove(id) {
    return repository.remove(id);
  },
};
