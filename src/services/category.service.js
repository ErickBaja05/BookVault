const { sendEvent } = require('../clients/eventClient');
const { AppError } = require('../middlewares/errorHandler');
const repository = require('../repositories/category.repository');

function parseCategoryId(rawId) {
  const numericId = Number(rawId);
  if (!Number.isInteger(numericId) || numericId <= 0) {
    throw new AppError(400, 'El código de categoría debe ser un entero positivo');
  }
  return numericId;
}

function validateCategoryPayload(data = {}) {
  const nombre = typeof data.nombre === 'string' ? data.nombre.trim() : '';
  if (!nombre) {
    throw new AppError(400, 'El nombre de la categoría es obligatorio');
  }

  let descripcion = null;
  if (data.descripcion !== undefined && data.descripcion !== null) {
    if (typeof data.descripcion !== 'string') {
      throw new AppError(400, 'La descripción de la categoría debe ser texto');
    }
    const trimmed = data.descripcion.trim();
    descripcion = trimmed.length > 0 ? trimmed : null;
  }

  return { nombre, descripcion };
}

async function findAll(filters = {}) {
  const categories = repository.findAll(filters);

  await sendEvent({
    entity: 'category',
    action: 'QUERY',
    title: 'Consulta de categorías',
    description: `Se consultaron ${categories.length} categorías del catálogo`,
    payload: { filters, count: categories.length },
  });

  return categories;
}

async function findById(id) {
  const numericId = parseCategoryId(id);
  const category = repository.findById(numericId);

  if (!category) {
    throw new AppError(404, 'Categoría no encontrada');
  }

  await sendEvent({
    entity: 'category',
    action: 'QUERY',
    title: 'Consulta de categoría',
    description: `Se consultó la categoría "${category.nombre}"`,
    payload: { cod_categoria: category.cod_categoria, nombre: category.nombre },
  });

  return category;
}

async function create(data) {
  const payload = validateCategoryPayload(data);

  const duplicated = repository.findByName(payload.nombre);
  if (duplicated) {
    throw new AppError(409, 'Ya existe una categoría con ese nombre');
  }

  const created = repository.create(payload);

  await sendEvent({
    entity: 'category',
    action: 'CREATE',
    title: 'Categoría creada',
    description: `Se registró la categoría "${created.nombre}"`,
    payload: created,
  });

  return created;
}

async function update(id, data) {
  const numericId = parseCategoryId(id);
  const existing = repository.findById(numericId);

  if (!existing) {
    throw new AppError(404, 'Categoría no encontrada');
  }

  const payload = validateCategoryPayload(data);

  const duplicated = repository.findByName(payload.nombre, numericId);
  if (duplicated) {
    throw new AppError(409, 'Ya existe otra categoría con ese nombre');
  }

  const updated = repository.update(numericId, payload);

  await sendEvent({
    entity: 'category',
    action: 'UPDATE',
    title: 'Categoría actualizada',
    description: `Se actualizó la categoría "${updated.nombre}"`,
    payload: updated,
  });

  return updated;
}

async function remove(id) {
  const numericId = parseCategoryId(id);
  const existing = repository.findById(numericId);

  if (!existing) {
    throw new AppError(404, 'Categoría no encontrada');
  }

  const linkedBooks = repository.countBooks(numericId);
  if (linkedBooks > 0) {
    throw new AppError(
      409,
      'No se puede eliminar la categoría porque tiene libros asociados',
    );
  }

  repository.remove(numericId);

  await sendEvent({
    entity: 'category',
    action: 'DELETE',
    title: 'Categoría eliminada',
    description: `Se eliminó la categoría "${existing.nombre}"`,
    payload: { cod_categoria: existing.cod_categoria, nombre: existing.nombre },
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
