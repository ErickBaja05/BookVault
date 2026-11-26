const { sendEvent } = require('../clients/eventClient');
const { AppError } = require('../middlewares/errorHandler');
const repository = require('../repositories/author.repository');

function parseAuthorId(rawId) {
  const numericId = Number(rawId);
  if (!Number.isInteger(numericId) || numericId <= 0) {
    throw new AppError(400, 'El código de autor debe ser un entero positivo');
  }
  return numericId;
}

function validateAuthorPayload(data = {}) {
  const nombre = typeof data.nombre === 'string' ? data.nombre.trim() : '';
  if (!nombre) {
    throw new AppError(400, 'El nombre del autor es obligatorio');
  }

  let nacionalidad = null;
  if (data.nacionalidad !== undefined && data.nacionalidad !== null) {
    if (typeof data.nacionalidad !== 'string') {
      throw new AppError(400, 'La nacionalidad del autor debe ser texto');
    }
    const trimmed = data.nacionalidad.trim();
    nacionalidad = trimmed.length > 0 ? trimmed : null;
  }

  return { nombre, nacionalidad };
}

async function findAll(filters = {}) {
  const authors = repository.findAll(filters);

  await sendEvent({
    entity: 'author',
    action: 'QUERY',
    title: 'Consulta de autores',
    description: `Se consultaron ${authors.length} autores del catálogo`,
    payload: { filters, count: authors.length },
  });

  return authors;
}

async function findById(id) {
  const numericId = parseAuthorId(id);
  const author = repository.findById(numericId);

  if (!author) {
    throw new AppError(404, 'Autor no encontrado');
  }

  await sendEvent({
    entity: 'author',
    action: 'QUERY',
    title: 'Consulta de autor',
    description: `Se consultó el autor "${author.nombre}"`,
    payload: { cod_autor: author.cod_autor, nombre: author.nombre },
  });

  return author;
}

async function create(data) {
  const payload = validateAuthorPayload(data);
  const created = repository.create(payload);

  await sendEvent({
    entity: 'author',
    action: 'CREATE',
    title: 'Autor creado',
    description: `Se registró el autor "${created.nombre}"`,
    payload: created,
  });

  return created;
}

async function update(id, data) {
  const numericId = parseAuthorId(id);
  const existing = repository.findById(numericId);

  if (!existing) {
    throw new AppError(404, 'Autor no encontrado');
  }

  const payload = validateAuthorPayload(data);
  const updated = repository.update(numericId, payload);

  await sendEvent({
    entity: 'author',
    action: 'UPDATE',
    title: 'Autor actualizado',
    description: `Se actualizó el autor "${updated.nombre}"`,
    payload: updated,
  });

  return updated;
}

async function remove(id) {
  const numericId = parseAuthorId(id);
  const existing = repository.findById(numericId);

  if (!existing) {
    throw new AppError(404, 'Autor no encontrado');
  }

  const linkedBooks = repository.countBooks(numericId);
  if (linkedBooks > 0) {
    throw new AppError(
      409,
      'No se puede eliminar el autor porque participa en al menos un libro',
    );
  }

  repository.remove(numericId);

  await sendEvent({
    entity: 'author',
    action: 'DELETE',
    title: 'Autor eliminado',
    description: `Se eliminó el autor "${existing.nombre}"`,
    payload: { cod_autor: existing.cod_autor, nombre: existing.nombre },
  });

  return existing;
}

module.exports = {
  create,
  findAll,
  findById,
  remove,
  update,
};
