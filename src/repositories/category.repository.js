const { getDatabase } = require('../db/database');

function findAll(filters = {}) {
  const db = getDatabase();
  const conditions = [];
  const params = [];

  const q = typeof filters.q === 'string' ? filters.q.trim() : '';
  if (q) {
    const pattern = `%${q}%`;
    conditions.push('(c.nombre LIKE ? OR COALESCE(c.descripcion, \'\') LIKE ?)');
    params.push(pattern, pattern);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const sql = `
    SELECT
      c.cod_categoria,
      c.nombre,
      c.descripcion,
      COUNT(b.isbn) AS libros_count
    FROM categories c
    LEFT JOIN books b ON b.cod_categoria = c.cod_categoria
    ${whereClause}
    GROUP BY c.cod_categoria
    ORDER BY c.cod_categoria ASC
  `;

  return db.prepare(sql).all(...params);
}

function findById(id) {
  const db = getDatabase();
  const sql = `
    SELECT
      c.cod_categoria,
      c.nombre,
      c.descripcion,
      COUNT(b.isbn) AS libros_count
    FROM categories c
    LEFT JOIN books b ON b.cod_categoria = c.cod_categoria
    WHERE c.cod_categoria = ?
    GROUP BY c.cod_categoria
  `;

  return db.prepare(sql).get(id) || null;
}

function findByName(nombre, excludeId = null) {
  const db = getDatabase();

  if (excludeId !== null && excludeId !== undefined) {
    const sql = `
      SELECT cod_categoria, nombre, descripcion
      FROM categories
      WHERE LOWER(TRIM(nombre)) = LOWER(TRIM(?))
        AND cod_categoria != ?
    `;
    return db.prepare(sql).get(nombre, excludeId) || null;
  }

  const sql = `
    SELECT cod_categoria, nombre, descripcion
    FROM categories
    WHERE LOWER(TRIM(nombre)) = LOWER(TRIM(?))
  `;
  return db.prepare(sql).get(nombre) || null;
}

function countBooks(id) {
  const db = getDatabase();
  const row = db
    .prepare('SELECT COUNT(*) AS total FROM books WHERE cod_categoria = ?')
    .get(id);
  return row ? row.total : 0;
}

function create({ nombre, descripcion = null }) {
  const db = getDatabase();
  const result = db
    .prepare('INSERT INTO categories (nombre, descripcion) VALUES (?, ?)')
    .run(nombre, descripcion);

  return findById(result.lastInsertRowid);
}

function update(id, { nombre, descripcion = null }) {
  const db = getDatabase();
  const result = db
    .prepare('UPDATE categories SET nombre = ?, descripcion = ? WHERE cod_categoria = ?')
    .run(nombre, descripcion, id);

  if (result.changes === 0) {
    return null;
  }

  return findById(id);
}

function remove(id) {
  const db = getDatabase();
  const result = db
    .prepare('DELETE FROM categories WHERE cod_categoria = ?')
    .run(id);

  return result.changes > 0;
}

module.exports = {
  countBooks,
  create,
  findAll,
  findById,
  findByName,
  remove,
  update,
};
