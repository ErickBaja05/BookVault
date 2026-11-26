const { getDatabase } = require('../db/database');

function findAll(filters = {}) {
  const db = getDatabase();
  const conditions = [];
  const params = [];

  const q = typeof filters.q === 'string' ? filters.q.trim() : '';
  if (q) {
    const pattern = `%${q}%`;
    conditions.push('(cl.cedula_cliente LIKE ? OR cl.nombre LIKE ? OR cl.correo LIKE ?)');
    params.push(pattern, pattern, pattern);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const sql = `
    SELECT
      cl.cedula_cliente,
      cl.nombre,
      cl.correo,
      cl.telefono,
      cl.direccion,
      COALESCE(SUM(CASE WHEN l.estado = 'ACTIVE' THEN 1 ELSE 0 END), 0) AS prestamos_activos
    FROM clients cl
    LEFT JOIN loans l ON l.cedula_cliente = cl.cedula_cliente
    ${whereClause}
    GROUP BY cl.cedula_cliente
    ORDER BY cl.nombre ASC
  `;

  return db.prepare(sql).all(...params);
}

function findById(cedula) {
  const db = getDatabase();
  const sql = `
    SELECT
      cl.cedula_cliente,
      cl.nombre,
      cl.correo,
      cl.telefono,
      cl.direccion,
      COALESCE(SUM(CASE WHEN l.estado = 'ACTIVE' THEN 1 ELSE 0 END), 0) AS prestamos_activos
    FROM clients cl
    LEFT JOIN loans l ON l.cedula_cliente = cl.cedula_cliente
    WHERE cl.cedula_cliente = ?
    GROUP BY cl.cedula_cliente
  `;

  return db.prepare(sql).get(cedula) || null;
}

function findByEmail(correo, excludeCedula = null) {
  const db = getDatabase();

  if (excludeCedula !== null && excludeCedula !== undefined) {
    const sql = `
      SELECT cedula_cliente, nombre, correo, telefono, direccion
      FROM clients
      WHERE LOWER(TRIM(correo)) = LOWER(TRIM(?))
        AND cedula_cliente != ?
    `;
    return db.prepare(sql).get(correo, excludeCedula) || null;
  }

  const sql = `
    SELECT cedula_cliente, nombre, correo, telefono, direccion
    FROM clients
    WHERE LOWER(TRIM(correo)) = LOWER(TRIM(?))
  `;
  return db.prepare(sql).get(correo) || null;
}

function countLoans(cedula) {
  const db = getDatabase();
  const row = db
    .prepare('SELECT COUNT(*) AS total FROM loans WHERE cedula_cliente = ?')
    .get(cedula);
  return row ? row.total : 0;
}

function countAll() {
  const db = getDatabase();
  const row = db.prepare('SELECT COUNT(*) AS total FROM clients').get();
  return row ? row.total : 0;
}

function create({ cedula_cliente, nombre, correo, telefono = null, direccion = null }) {
  const db = getDatabase();
  db.prepare(
    `
    INSERT INTO clients (cedula_cliente, nombre, correo, telefono, direccion)
    VALUES (?, ?, ?, ?, ?)
    `,
  ).run(cedula_cliente, nombre, correo, telefono, direccion);

  return findById(cedula_cliente);
}

function update(cedula, { nombre, correo, telefono = null, direccion = null }) {
  const db = getDatabase();
  const result = db
    .prepare(
      `
      UPDATE clients
      SET nombre = ?, correo = ?, telefono = ?, direccion = ?
      WHERE cedula_cliente = ?
      `,
    )
    .run(nombre, correo, telefono, direccion, cedula);

  if (result.changes === 0) {
    return null;
  }

  return findById(cedula);
}

function remove(cedula) {
  const db = getDatabase();
  const result = db
    .prepare('DELETE FROM clients WHERE cedula_cliente = ?')
    .run(cedula);

  return result.changes > 0;
}

module.exports = {
  countAll,
  countLoans,
  create,
  findAll,
  findByEmail,
  findById,
  remove,
  update,
};
