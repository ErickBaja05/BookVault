const { sendEvent } = require('../clients/eventClient');
const { AppError } = require('../middlewares/errorHandler');
const bookRepository = require('../repositories/book.repository');
const clientRepository = require('../repositories/client.repository');
const loanRepository = require('../repositories/loan.repository');

const VALID_LOAN_STATUSES = new Set(['ACTIVE', 'RETURNED', 'ALL']);

function parseLoanId(rawId) {
  const numericId = Number(rawId);
  if (!Number.isInteger(numericId) || numericId <= 0) {
    throw new AppError(400, 'El código de préstamo debe ser un entero positivo');
  }
  return numericId;
}

function getTodayISODate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function isValidCalendarDate(dateString) {
  if (typeof dateString !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return false;
  }
  const [year, month, day] = dateString.split('-').map(Number);
  const parsed = new Date(year, month - 1, day);
  return (
    parsed.getFullYear() === year &&
    parsed.getMonth() === month - 1 &&
    parsed.getDate() === day
  );
}

function isValidDateOrTimestamp(value) {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  if (isValidCalendarDate(trimmed)) return true;
  if (/^\d{4}-\d{2}-\d{2}T/.test(trimmed) && !Number.isNaN(Date.parse(trimmed))) {
    return true;
  }
  return false;
}

function normalizeLoanFilters(filters = {}) {
  const normalized = {};

  const rawStatus = filters.status ?? filters.estado;
  if (typeof rawStatus === 'string' && rawStatus.trim()) {
    const status = rawStatus.trim().toUpperCase();
    if (!VALID_LOAN_STATUSES.has(status)) {
      throw new AppError(400, "El filtro de estado debe ser 'ACTIVE', 'RETURNED' o 'ALL'");
    }
    if (status !== 'ALL') {
      normalized.status = status;
    }
  }

  const rawCedula = filters.cedula ?? filters.cedula_cliente;
  if (typeof rawCedula === 'string' && rawCedula.trim()) {
    normalized.cedula = rawCedula.trim();
  }

  if (typeof filters.isbn === 'string' && filters.isbn.trim()) {
    normalized.isbn = filters.isbn.trim();
  }

  if (typeof filters.q === 'string' && filters.q.trim()) {
    normalized.q = filters.q.trim();
  }

  return normalized;
}

async function findAll(filters = {}) {
  const normalizedFilters = normalizeLoanFilters(filters);
  const loans = loanRepository.findAll(normalizedFilters);

  await sendEvent({
    entity: 'loan',
    action: 'QUERY',
    title: 'Consulta de préstamos',
    description: `Se consultaron ${loans.length} préstamos`,
    payload: { filters: normalizedFilters, count: loans.length },
  });

  return loans;
}

async function findById(id) {
  const numericId = parseLoanId(id);
  const loan = loanRepository.findById(numericId);

  if (!loan) {
    throw new AppError(404, 'Préstamo no encontrado');
  }

  await sendEvent({
    entity: 'loan',
    action: 'QUERY',
    title: 'Consulta de préstamo',
    description: `Se consultó el préstamo #${loan.cod_prestamo}`,
    payload: { cod_prestamo: loan.cod_prestamo, isbn: loan.isbn, estado: loan.estado },
  });

  return loan;
}

async function create(data = {}) {
  const isbn = typeof data.isbn === 'string' ? data.isbn.trim() : '';
  if (!isbn) {
    throw new AppError(400, 'El ISBN del libro es obligatorio');
  }

  const cedula_cliente =
    typeof data.cedula_cliente === 'string' ? data.cedula_cliente.trim() : '';
  if (!cedula_cliente) {
    throw new AppError(400, 'La cédula del cliente es obligatoria');
  }

  const fecha_prestamo =
    data.fecha_prestamo !== undefined && data.fecha_prestamo !== null && String(data.fecha_prestamo).trim() !== ''
      ? String(data.fecha_prestamo).trim()
      : getTodayISODate();

  if (!isValidCalendarDate(fecha_prestamo)) {
    throw new AppError(400, 'La fecha de préstamo debe tener formato válido YYYY-MM-DD');
  }

  const fecha_limite = typeof data.fecha_limite === 'string' ? data.fecha_limite.trim() : '';
  if (!isValidCalendarDate(fecha_limite)) {
    throw new AppError(400, 'La fecha límite es obligatoria y debe tener formato válido YYYY-MM-DD');
  }

  if (fecha_limite < fecha_prestamo) {
    throw new AppError(
      400,
      'La fecha límite debe ser posterior o igual a la fecha de préstamo',
    );
  }

  const book = bookRepository.findById(isbn);
  if (!book) {
    throw new AppError(404, 'Libro no encontrado');
  }

  const client = clientRepository.findById(cedula_cliente);
  if (!client) {
    throw new AppError(404, 'Cliente no encontrado');
  }

  // RN-08: Control estricto y atómico de disponibilidad al prestar
  if (book.copias_disponibles <= 0) {
    throw new AppError(409, 'No existen copias disponibles para prestar este libro');
  }

  const created = loanRepository.create({
    isbn,
    cedula_cliente,
    fecha_prestamo,
    fecha_limite,
  });

  if (!created) {
    throw new AppError(409, 'No existen copias disponibles para prestar este libro');
  }

  await sendEvent({
    entity: 'loan',
    action: 'CREATE',
    title: 'Préstamo registrado',
    description: `Se registró el préstamo #${created.cod_prestamo} del libro "${created.libro_titulo}" a ${created.cliente_nombre}`,
    payload: created,
  });

  return created;
}

async function returnLoan(id, data = {}) {
  const numericId = parseLoanId(id);

  let fechaDevolucion;
  if (
    data &&
    data.fecha_devolucion !== undefined &&
    data.fecha_devolucion !== null &&
    String(data.fecha_devolucion).trim() !== ''
  ) {
    const candidate = String(data.fecha_devolucion).trim();
    if (!isValidDateOrTimestamp(candidate)) {
      throw new AppError(400, 'La fecha de devolución debe tener un formato de fecha válido');
    }
    fechaDevolucion = candidate;
  } else {
    fechaDevolucion = new Date().toISOString();
  }

  // RN-09: Transición atómica ACTIVE -> RETURNED e incremento de inventario
  const result = loanRepository.markAsReturned(numericId, fechaDevolucion);

  if (result.status === 'NOT_FOUND') {
    throw new AppError(404, 'Préstamo no encontrado');
  }

  if (result.status === 'ALREADY_RETURNED') {
    throw new AppError(409, 'El préstamo ya se encuentra en estado RETURNED');
  }

  await sendEvent({
    entity: 'loan',
    action: 'UPDATE',
    title: 'Devolución de préstamo registrada',
    description: `Se registró la devolución del préstamo #${result.loan.cod_prestamo} (${result.loan.isbn})`,
    payload: result.loan,
  });

  return result.loan;
}

async function update(_id, _data) {
  throw new AppError(
    405,
    'Los préstamos no se editan directamente; utilice la operación de devolución',
  );
}

async function remove(_id) {
  throw new AppError(
    405,
    'Los préstamos no pueden eliminarse para preservar el historial de auditoría',
  );
}

module.exports = {
  create,
  findAll,
  findById,
  remove,
  returnLoan,
  update,
};
