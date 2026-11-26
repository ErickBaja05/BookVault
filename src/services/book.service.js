const { sendEvent } = require('../clients/eventClient');
const { AppError } = require('../middlewares/errorHandler');
const authorRepository = require('../repositories/author.repository');
const bookRepository = require('../repositories/book.repository');
const categoryRepository = require('../repositories/category.repository');

const VALID_AUTHOR_ROLES = new Set(['PRINCIPAL', 'COAUTOR']);

function parsePositiveInt(rawValue, errorMessage) {
  const value = Number(rawValue);
  if (!Number.isInteger(value) || value <= 0) {
    throw new AppError(400, errorMessage);
  }
  return value;
}

function validateAndNormalizeAuthors(rawAuthors) {
  if (!Array.isArray(rawAuthors) || rawAuthors.length === 0) {
    throw new AppError(400, 'El libro debe tener al menos un autor asociado');
  }

  const seenAuthorIds = new Set();
  const normalized = [];

  for (const item of rawAuthors) {
    const rawId = typeof item === 'object' && item !== null ? item.cod_autor : item;
    const codAutor = parsePositiveInt(
      rawId,
      'Todos los códigos de autor deben ser enteros positivos',
    );

    if (seenAuthorIds.has(codAutor)) {
      throw new AppError(400, 'No se puede repetir el mismo autor en un libro');
    }
    seenAuthorIds.add(codAutor);

    const rawRole =
      typeof item === 'object' && item !== null && item.rol !== undefined && item.rol !== null
        ? String(item.rol).trim().toUpperCase()
        : 'PRINCIPAL';

    if (!VALID_AUTHOR_ROLES.has(rawRole)) {
      throw new AppError(400, "El rol del autor debe ser 'PRINCIPAL' o 'COAUTOR'");
    }

    normalized.push({ cod_autor: codAutor, rol: rawRole });
  }

  const authorIds = normalized.map((a) => a.cod_autor);
  const existingAuthors = authorRepository.findByIds(authorIds);
  if (existingAuthors.length !== authorIds.length) {
    throw new AppError(404, 'Uno o más autores especificados no existen');
  }

  return normalized;
}

function validateBookFields(data = {}, { requireIsbn = true } = {}) {
  let isbn;
  if (requireIsbn) {
    isbn = typeof data.isbn === 'string' ? data.isbn.trim() : '';
    if (!isbn) {
      throw new AppError(400, 'El ISBN del libro es obligatorio');
    }
  }

  const titulo = typeof data.titulo === 'string' ? data.titulo.trim() : '';
  if (!titulo) {
    throw new AppError(400, 'El título del libro es obligatorio');
  }

  const cod_categoria = parsePositiveInt(
    data.cod_categoria,
    'La categoría del libro es obligatoria y debe ser un código válido',
  );

  const category = categoryRepository.findById(cod_categoria);
  if (!category) {
    throw new AppError(404, 'La categoría especificada no existe');
  }

  const anio_publicacion = Number(data.anio_publicacion);
  const currentYear = new Date().getFullYear();
  if (
    !Number.isInteger(anio_publicacion) ||
    anio_publicacion < 1000 ||
    anio_publicacion > currentYear
  ) {
    throw new AppError(
      400,
      `El año de publicación debe ser un entero entre 1000 y ${currentYear}`,
    );
  }

  const cantidad_total = Number(data.cantidad_total);
  if (!Number.isInteger(cantidad_total) || cantidad_total < 1) {
    throw new AppError(400, 'La cantidad total de ejemplares debe ser un entero mayor o igual a 1');
  }

  const autores = validateAndNormalizeAuthors(data.autores);

  return {
    ...(requireIsbn ? { isbn } : {}),
    cod_categoria,
    titulo,
    anio_publicacion,
    cantidad_total,
    autores,
  };
}

function normalizeBookFilters(filters = {}) {
  const normalized = {};

  if (typeof filters.q === 'string' && filters.q.trim()) {
    normalized.q = filters.q.trim();
  }

  const rawCategory = filters.category ?? filters.cod_categoria;
  if (rawCategory !== undefined && rawCategory !== null && String(rawCategory).trim() !== '') {
    normalized.category = parsePositiveInt(
      rawCategory,
      'El filtro de categoría debe ser un entero positivo',
    );
  }

  const rawAuthor = filters.author ?? filters.cod_autor;
  if (rawAuthor !== undefined && rawAuthor !== null && String(rawAuthor).trim() !== '') {
    normalized.author = parsePositiveInt(
      rawAuthor,
      'El filtro de autor debe ser un entero positivo',
    );
  }

  const rawAvailable = filters.available ?? filters.solo_disponibles;
  if (
    rawAvailable === true ||
    rawAvailable === 'true' ||
    rawAvailable === '1'
  ) {
    normalized.available = true;
  }

  return normalized;
}

async function findAll(filters = {}) {
  const normalizedFilters = normalizeBookFilters(filters);
  const books = bookRepository.findAll(normalizedFilters);

  await sendEvent({
    entity: 'book',
    action: 'QUERY',
    title: 'Consulta de libros',
    description: `Se consultaron ${books.length} libros del catálogo`,
    payload: { filters: normalizedFilters, count: books.length },
  });

  return books;
}

async function findById(isbn) {
  const cleanIsbn = typeof isbn === 'string' ? isbn.trim() : '';
  if (!cleanIsbn) {
    throw new AppError(400, 'El ISBN del libro es obligatorio');
  }

  const book = bookRepository.findById(cleanIsbn);
  if (!book) {
    throw new AppError(404, 'Libro no encontrado');
  }

  await sendEvent({
    entity: 'book',
    action: 'QUERY',
    title: 'Consulta de libro',
    description: `Se consultó el libro "${book.titulo}" (${book.isbn})`,
    payload: { isbn: book.isbn, titulo: book.titulo },
  });

  return book;
}

async function create(data) {
  const payload = validateBookFields(data, { requireIsbn: true });

  const duplicated = bookRepository.findById(payload.isbn);
  if (duplicated) {
    throw new AppError(409, 'Ya existe un libro registrado con ese ISBN');
  }

  const created = bookRepository.create({
    ...payload,
    copias_disponibles: payload.cantidad_total,
  });

  await sendEvent({
    entity: 'book',
    action: 'CREATE',
    title: 'Libro registrado',
    description: `Se registró el libro "${created.titulo}" (${created.isbn})`,
    payload: created,
  });

  return created;
}

async function update(isbn, data) {
  const cleanIsbn = typeof isbn === 'string' ? isbn.trim() : '';
  if (!cleanIsbn) {
    throw new AppError(400, 'El ISBN del libro es obligatorio');
  }

  const existing = bookRepository.findById(cleanIsbn);
  if (!existing) {
    throw new AppError(404, 'Libro no encontrado');
  }

  const payload = validateBookFields(data, { requireIsbn: false });

  // RN-04: No reducir cantidad_total por debajo de los ejemplares prestados actualmente
  const prestadosActivos = existing.cantidad_total - existing.copias_disponibles;
  if (payload.cantidad_total < prestadosActivos) {
    throw new AppError(
      409,
      `No se puede reducir la cantidad total a ${payload.cantidad_total} porque hay ${prestadosActivos} ejemplares prestados actualmente`,
    );
  }

  const copias_disponibles = payload.cantidad_total - prestadosActivos;

  const updated = bookRepository.update(cleanIsbn, {
    ...payload,
    copias_disponibles,
  });

  await sendEvent({
    entity: 'book',
    action: 'UPDATE',
    title: 'Libro actualizado',
    description: `Se actualizó el libro "${updated.titulo}" (${updated.isbn})`,
    payload: updated,
  });

  return updated;
}

async function remove(isbn) {
  const cleanIsbn = typeof isbn === 'string' ? isbn.trim() : '';
  if (!cleanIsbn) {
    throw new AppError(400, 'El ISBN del libro es obligatorio');
  }

  const existing = bookRepository.findById(cleanIsbn);
  if (!existing) {
    throw new AppError(404, 'Libro no encontrado');
  }

  // RN-10: No eliminar libro si tiene préstamos asociados (ACTIVE o RETURNED)
  const linkedLoans = bookRepository.countLoans(cleanIsbn);
  if (linkedLoans > 0) {
    throw new AppError(
      409,
      'No se puede eliminar el libro porque tiene préstamos asociados en el historial',
    );
  }

  bookRepository.remove(cleanIsbn);

  await sendEvent({
    entity: 'book',
    action: 'DELETE',
    title: 'Libro eliminado',
    description: `Se eliminó el libro "${existing.titulo}" (${existing.isbn})`,
    payload: { isbn: existing.isbn, titulo: existing.titulo },
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
