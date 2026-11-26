const { getDatabase, runInTransaction } = require('../db/database');

function attachAuthors(books) {
  if (!books || books.length === 0) {
    return [];
  }

  const db = getDatabase();
  const isbns = books.map((book) => book.isbn);
  const placeholders = isbns.map(() => '?').join(', ');

  const authorRows = db
    .prepare(
      `
      SELECT
        ab.isbn,
        ab.cod_autor,
        ab.rol,
        a.nombre,
        a.nacionalidad
      FROM author_books ab
      INNER JOIN authors a ON a.cod_autor = ab.cod_autor
      WHERE ab.isbn IN (${placeholders})
      ORDER BY
        CASE ab.rol WHEN 'PRINCIPAL' THEN 0 ELSE 1 END,
        a.nombre ASC
      `,
    )
    .all(...isbns);

  const authorsByIsbn = new Map();
  for (const row of authorRows) {
    if (!authorsByIsbn.has(row.isbn)) {
      authorsByIsbn.set(row.isbn, []);
    }
    authorsByIsbn.get(row.isbn).push({
      cod_autor: row.cod_autor,
      nombre: row.nombre,
      nacionalidad: row.nacionalidad,
      rol: row.rol,
    });
  }

  return books.map((book) => ({
    ...book,
    autores: authorsByIsbn.get(book.isbn) || [],
  }));
}

function findAll(filters = {}) {
  const db = getDatabase();
  const conditions = [];
  const params = [];

  const q = typeof filters.q === 'string' ? filters.q.trim() : '';
  if (q) {
    const pattern = `%${q}%`;
    conditions.push('(b.titulo LIKE ? OR b.isbn LIKE ?)');
    params.push(pattern, pattern);
  }

  const categoryId = filters.category ?? filters.cod_categoria;
  if (categoryId !== undefined && categoryId !== null && categoryId !== '') {
    conditions.push('b.cod_categoria = ?');
    params.push(Number(categoryId));
  }

  const authorId = filters.author ?? filters.cod_autor;
  if (authorId !== undefined && authorId !== null && authorId !== '') {
    conditions.push(
      'EXISTS (SELECT 1 FROM author_books ab WHERE ab.isbn = b.isbn AND ab.cod_autor = ?)',
    );
    params.push(Number(authorId));
  }

  const onlyAvailable = filters.available ?? filters.solo_disponibles;
  if (onlyAvailable === true || onlyAvailable === 'true' || onlyAvailable === '1') {
    conditions.push('b.copias_disponibles > 0');
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const sql = `
    SELECT
      b.isbn,
      b.cod_categoria,
      c.nombre AS categoria_nombre,
      b.titulo,
      b.anio_publicacion,
      b.cantidad_total,
      b.copias_disponibles
    FROM books b
    INNER JOIN categories c ON c.cod_categoria = b.cod_categoria
    ${whereClause}
    ORDER BY b.titulo ASC
  `;

  const rows = db.prepare(sql).all(...params);
  return attachAuthors(rows);
}

function findById(isbn) {
  const db = getDatabase();
  const row = db
    .prepare(
      `
      SELECT
        b.isbn,
        b.cod_categoria,
        c.nombre AS categoria_nombre,
        b.titulo,
        b.anio_publicacion,
        b.cantidad_total,
        b.copias_disponibles
      FROM books b
      INNER JOIN categories c ON c.cod_categoria = b.cod_categoria
      WHERE b.isbn = ?
      `,
    )
    .get(isbn);

  if (!row) {
    return null;
  }

  return attachAuthors([row])[0];
}

function countLoans(isbn) {
  const db = getDatabase();
  const row = db
    .prepare('SELECT COUNT(*) AS total FROM loans WHERE isbn = ?')
    .get(isbn);
  return row ? row.total : 0;
}

function countActiveLoans(isbn) {
  const db = getDatabase();
  const row = db
    .prepare("SELECT COUNT(*) AS total FROM loans WHERE isbn = ? AND estado = 'ACTIVE'")
    .get(isbn);
  return row ? row.total : 0;
}

function getInventorySummary() {
  const db = getDatabase();
  return db
    .prepare(
      `
      SELECT
        COUNT(*) AS total_titulos,
        COALESCE(SUM(cantidad_total), 0) AS total_ejemplares,
        COALESCE(SUM(copias_disponibles), 0) AS copias_disponibles
      FROM books
      `,
    )
    .get();
}

function create({
  isbn,
  cod_categoria,
  titulo,
  anio_publicacion,
  cantidad_total,
  copias_disponibles = cantidad_total,
  autores = [],
}) {
  const db = getDatabase();

  runInTransaction(() => {
    db.prepare(
      `
      INSERT INTO books (
        isbn,
        cod_categoria,
        titulo,
        anio_publicacion,
        cantidad_total,
        copias_disponibles
      ) VALUES (?, ?, ?, ?, ?, ?)
      `,
    ).run(
      isbn,
      cod_categoria,
      titulo,
      anio_publicacion,
      cantidad_total,
      copias_disponibles,
    );

    const insertAuthorLink = db.prepare(
      'INSERT INTO author_books (isbn, cod_autor, rol) VALUES (?, ?, ?)',
    );
    for (const author of autores) {
      insertAuthorLink.run(isbn, author.cod_autor, author.rol || 'PRINCIPAL');
    }
  });

  return findById(isbn);
}

function update(
  isbn,
  { cod_categoria, titulo, anio_publicacion, cantidad_total, copias_disponibles, autores },
) {
  const db = getDatabase();

  const updated = runInTransaction(() => {
    const result = db
      .prepare(
        `
        UPDATE books
        SET
          cod_categoria = ?,
          titulo = ?,
          anio_publicacion = ?,
          cantidad_total = ?,
          copias_disponibles = ?
        WHERE isbn = ?
        `,
      )
      .run(
        cod_categoria,
        titulo,
        anio_publicacion,
        cantidad_total,
        copias_disponibles,
        isbn,
      );

    if (result.changes === 0) {
      return false;
    }

    if (Array.isArray(autores)) {
      db.prepare('DELETE FROM author_books WHERE isbn = ?').run(isbn);
      const insertAuthorLink = db.prepare(
        'INSERT INTO author_books (isbn, cod_autor, rol) VALUES (?, ?, ?)',
      );
      for (const author of autores) {
        insertAuthorLink.run(isbn, author.cod_autor, author.rol || 'PRINCIPAL');
      }
    }

    return true;
  });

  if (!updated) {
    return null;
  }

  return findById(isbn);
}

function decrementAvailableCopies(isbn) {
  const db = getDatabase();
  const result = db
    .prepare(
      `
      UPDATE books
      SET copias_disponibles = copias_disponibles - 1
      WHERE isbn = ? AND copias_disponibles > 0
      `,
    )
    .run(isbn);

  return result.changes > 0;
}

function incrementAvailableCopies(isbn) {
  const db = getDatabase();
  const result = db
    .prepare(
      `
      UPDATE books
      SET copias_disponibles = copias_disponibles + 1
      WHERE isbn = ? AND copias_disponibles < cantidad_total
      `,
    )
    .run(isbn);

  return result.changes > 0;
}

function remove(isbn) {
  const db = getDatabase();
  const result = db.prepare('DELETE FROM books WHERE isbn = ?').run(isbn);
  return result.changes > 0;
}

module.exports = {
  countActiveLoans,
  countLoans,
  create,
  decrementAvailableCopies,
  findAll,
  findById,
  getInventorySummary,
  incrementAvailableCopies,
  remove,
  update,
};
