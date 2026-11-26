const { getDatabase } = require('../db/database');

function findAll(filters = {}) {
  const db = getDatabase();
  const conditions = [];
  const params = [];

  const q = typeof filters.q === 'string' ? filters.q.trim() : '';
  if (q) {
    const pattern = `%${q}%`;
    conditions.push('(a.nombre LIKE ? OR COALESCE(a.nacionalidad, \'\') LIKE ?)');
    params.push(pattern, pattern);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const sql = `
    SELECT
      a.cod_autor,
      a.nombre,
      a.nacionalidad,
      COUNT(ab.isbn) AS libros_count
    FROM authors a
    LEFT JOIN author_books ab ON ab.cod_autor = a.cod_autor
    ${whereClause}
    GROUP BY a.cod_autor
    ORDER BY a.cod_autor ASC
  `;

  return db.prepare(sql).all(...params);
}

function findById(id) {
  const db = getDatabase();
  const sql = `
    SELECT
      a.cod_autor,
      a.nombre,
      a.nacionalidad,
      COUNT(ab.isbn) AS libros_count
    FROM authors a
    LEFT JOIN author_books ab ON ab.cod_autor = a.cod_autor
    WHERE a.cod_autor = ?
    GROUP BY a.cod_autor
  `;

  return db.prepare(sql).get(id) || null;
}

function findByIds(ids = []) {
  const uniqueIds = [...new Set(ids)];
  if (uniqueIds.length === 0) {
    return [];
  }

  const db = getDatabase();
  const placeholders = uniqueIds.map(() => '?').join(', ');
  const sql = `
    SELECT cod_autor, nombre, nacionalidad
    FROM authors
    WHERE cod_autor IN (${placeholders})
    ORDER BY cod_autor ASC
  `;

  return db.prepare(sql).all(...uniqueIds);
}

function countBooks(id) {
  const db = getDatabase();
  const row = db
    .prepare('SELECT COUNT(*) AS total FROM author_books WHERE cod_autor = ?')
    .get(id);
  return row ? row.total : 0;
}

function create({ nombre, nacionalidad = null }) {
  const db = getDatabase();
  const result = db
    .prepare('INSERT INTO authors (nombre, nacionalidad) VALUES (?, ?)')
    .run(nombre, nacionalidad);

  return findById(result.lastInsertRowid);
}

function update(id, { nombre, nacionalidad = null }) {
  const db = getDatabase();
  const result = db
    .prepare('UPDATE authors SET nombre = ?, nacionalidad = ? WHERE cod_autor = ?')
    .run(nombre, nacionalidad, id);

  if (result.changes === 0) {
    return null;
  }

  return findById(id);
}

function remove(id) {
  const db = getDatabase();
  const result = db
    .prepare('DELETE FROM authors WHERE cod_autor = ?')
    .run(id);

  return result.changes > 0;
}

module.exports = {
  countBooks,
  create,
  findAll,
  findById,
  findByIds,
  remove,
  update,
};
