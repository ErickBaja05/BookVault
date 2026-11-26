const { getDatabase, runInTransaction } = require('../db/database');
const bookRepository = require('./book.repository');

function findAll(filters = {}) {
  const db = getDatabase();
  const conditions = [];
  const params = [];

  const status = typeof filters.status === 'string'
    ? filters.status.trim().toUpperCase()
    : typeof filters.estado === 'string'
      ? filters.estado.trim().toUpperCase()
      : '';

  if (status && status !== 'ALL') {
    conditions.push('l.estado = ?');
    params.push(status);
  }

  const cedula = typeof filters.cedula === 'string'
    ? filters.cedula.trim()
    : typeof filters.cedula_cliente === 'string'
      ? filters.cedula_cliente.trim()
      : '';

  if (cedula) {
    conditions.push('l.cedula_cliente = ?');
    params.push(cedula);
  }

  const isbn = typeof filters.isbn === 'string' ? filters.isbn.trim() : '';
  if (isbn) {
    conditions.push('l.isbn = ?');
    params.push(isbn);
  }

  const q = typeof filters.q === 'string' ? filters.q.trim() : '';
  if (q) {
    const pattern = `%${q}%`;
    conditions.push(
      '(CAST(l.cod_prestamo AS TEXT) LIKE ? OR l.isbn LIKE ? OR b.titulo LIKE ? OR l.cedula_cliente LIKE ? OR cl.nombre LIKE ?)',
    );
    params.push(pattern, pattern, pattern, pattern, pattern);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const sql = `
    SELECT
      l.cod_prestamo,
      l.isbn,
      b.titulo AS libro_titulo,
      l.cedula_cliente,
      cl.nombre AS cliente_nombre,
      cl.correo AS cliente_correo,
      l.fecha_prestamo,
      l.fecha_limite,
      l.fecha_devolucion,
      l.estado
    FROM loans l
    INNER JOIN books b ON b.isbn = l.isbn
    INNER JOIN clients cl ON cl.cedula_cliente = l.cedula_cliente
    ${whereClause}
    ORDER BY l.cod_prestamo DESC
  `;

  return db.prepare(sql).all(...params);
}

function findById(id) {
  const db = getDatabase();
  const sql = `
    SELECT
      l.cod_prestamo,
      l.isbn,
      b.titulo AS libro_titulo,
      l.cedula_cliente,
      cl.nombre AS cliente_nombre,
      cl.correo AS cliente_correo,
      l.fecha_prestamo,
      l.fecha_limite,
      l.fecha_devolucion,
      l.estado
    FROM loans l
    INNER JOIN books b ON b.isbn = l.isbn
    INNER JOIN clients cl ON cl.cedula_cliente = l.cedula_cliente
    WHERE l.cod_prestamo = ?
  `;

  return db.prepare(sql).get(id) || null;
}

function countByStatus() {
  const db = getDatabase();
  return db
    .prepare(
      `
      SELECT
        COALESCE(SUM(CASE WHEN estado = 'ACTIVE' THEN 1 ELSE 0 END), 0) AS active_count,
        COALESCE(SUM(CASE WHEN estado = 'RETURNED' THEN 1 ELSE 0 END), 0) AS returned_count,
        COUNT(*) AS total_count
      FROM loans
      `,
    )
    .get();
}

/**
 * Registra un préstamo de 1 ejemplar y descuenta copias_disponibles de forma
 * atómica (RN-07 y RN-08). Retorna null si el libro no tiene copias disponibles.
 */
function create({ isbn, cedula_cliente, fecha_prestamo, fecha_limite }) {
  const db = getDatabase();

  const createdId = runInTransaction(() => {
    const decremented = bookRepository.decrementAvailableCopies(isbn);
    if (!decremented) {
      return null;
    }

    const result = db
      .prepare(
        `
        INSERT INTO loans (
          isbn,
          cedula_cliente,
          fecha_prestamo,
          fecha_limite,
          fecha_devolucion,
          estado
        ) VALUES (?, ?, ?, ?, NULL, 'ACTIVE')
        `,
      )
      .run(isbn, cedula_cliente, fecha_prestamo, fecha_limite);

    return result.lastInsertRowid;
  });

  if (createdId === null) {
    return null;
  }

  return findById(createdId);
}

/**
 * Registra la devolución de un préstamo activo e incrementa copias_disponibles
 * de forma atómica (RN-09). Los préstamos no se editan libremente ni se eliminan.
 */
function markAsReturned(id, fecha_devolucion) {
  const db = getDatabase();

  return runInTransaction(() => {
    const existing = findById(id);
    if (!existing) {
      return { status: 'NOT_FOUND', loan: null };
    }

    if (existing.estado !== 'ACTIVE') {
      return { status: 'ALREADY_RETURNED', loan: existing };
    }

    const updated = db
      .prepare(
        `
        UPDATE loans
        SET estado = 'RETURNED', fecha_devolucion = ?
        WHERE cod_prestamo = ? AND estado = 'ACTIVE'
        `,
      )
      .run(fecha_devolucion, id);

    if (updated.changes === 0) {
      return { status: 'ALREADY_RETURNED', loan: findById(id) };
    }

    bookRepository.incrementAvailableCopies(existing.isbn);
    return { status: 'RETURNED', loan: findById(id) };
  });
}

module.exports = {
  countByStatus,
  create,
  findAll,
  findById,
  markAsReturned,
};
