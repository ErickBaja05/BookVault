const { sendEvent } = require('../clients/eventClient');
const { AppError } = require('../middlewares/errorHandler');
const repository = require('../repositories/client.repository');

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function parseOptionalText(value, fieldLabel) {
  if (value === undefined || value === null) {
    return null;
  }
  if (typeof value !== 'string') {
    throw new AppError(400, `El campo ${fieldLabel} debe ser texto`);
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function validateClientFields(data = {}, { requireCedula = true } = {}) {
  let cedula_cliente;
  if (requireCedula) {
    cedula_cliente = typeof data.cedula_cliente === 'string' ? data.cedula_cliente.trim() : '';
    if (!cedula_cliente) {
      throw new AppError(400, 'La cédula del cliente es obligatoria');
    }
  }

  const nombre = typeof data.nombre === 'string' ? data.nombre.trim() : '';
  if (!nombre) {
    throw new AppError(400, 'El nombre del cliente es obligatorio');
  }

  const correo = typeof data.correo === 'string' ? data.correo.trim().toLowerCase() : '';
  if (!correo || !EMAIL_PATTERN.test(correo)) {
    throw new AppError(400, 'Debe proporcionar un correo electrónico válido');
  }

  const telefono = parseOptionalText(data.telefono, 'teléfono');
  const direccion = parseOptionalText(data.direccion, 'dirección');

  return {
    ...(requireCedula ? { cedula_cliente } : {}),
    nombre,
    correo,
    telefono,
    direccion,
  };
}

async function findAll(filters = {}) {
  const clients = repository.findAll(filters);

  await sendEvent({
    entity: 'client',
    action: 'QUERY',
    title: 'Consulta de clientes',
    description: `Se consultaron ${clients.length} clientes registrados`,
    payload: { filters, count: clients.length },
  });

  return clients;
}

async function findById(cedula) {
  const cleanCedula = typeof cedula === 'string' ? cedula.trim() : '';
  if (!cleanCedula) {
    throw new AppError(400, 'La cédula del cliente es obligatoria');
  }

  const client = repository.findById(cleanCedula);
  if (!client) {
    throw new AppError(404, 'Cliente no encontrado');
  }

  await sendEvent({
    entity: 'client',
    action: 'QUERY',
    title: 'Consulta de cliente',
    description: `Se consultó el cliente "${client.nombre}" (${client.cedula_cliente})`,
    payload: { cedula_cliente: client.cedula_cliente, nombre: client.nombre },
  });

  return client;
}

async function create(data) {
  const payload = validateClientFields(data, { requireCedula: true });

  const existingByCedula = repository.findById(payload.cedula_cliente);
  if (existingByCedula) {
    throw new AppError(409, 'Ya existe un cliente registrado con esa cédula');
  }

  const existingByEmail = repository.findByEmail(payload.correo);
  if (existingByEmail) {
    throw new AppError(409, 'Ya existe un cliente registrado con ese correo electrónico');
  }

  const created = repository.create(payload);

  await sendEvent({
    entity: 'client',
    action: 'CREATE',
    title: 'Cliente registrado',
    description: `Se registró el cliente "${created.nombre}" (${created.cedula_cliente})`,
    payload: created,
  });

  return created;
}

async function update(cedula, data) {
  const cleanCedula = typeof cedula === 'string' ? cedula.trim() : '';
  if (!cleanCedula) {
    throw new AppError(400, 'La cédula del cliente es obligatoria');
  }

  const existing = repository.findById(cleanCedula);
  if (!existing) {
    throw new AppError(404, 'Cliente no encontrado');
  }

  const payload = validateClientFields(data, { requireCedula: false });

  const duplicatedEmail = repository.findByEmail(payload.correo, cleanCedula);
  if (duplicatedEmail) {
    throw new AppError(409, 'Ya existe otro cliente registrado con ese correo electrónico');
  }

  const updated = repository.update(cleanCedula, payload);

  await sendEvent({
    entity: 'client',
    action: 'UPDATE',
    title: 'Cliente actualizado',
    description: `Se actualizó el cliente "${updated.nombre}" (${updated.cedula_cliente})`,
    payload: updated,
  });

  return updated;
}

async function remove(cedula) {
  const cleanCedula = typeof cedula === 'string' ? cedula.trim() : '';
  if (!cleanCedula) {
    throw new AppError(400, 'La cédula del cliente es obligatoria');
  }

  const existing = repository.findById(cleanCedula);
  if (!existing) {
    throw new AppError(404, 'Cliente no encontrado');
  }

  // RN-10: No eliminar cliente si tiene préstamos registrados
  const linkedLoans = repository.countLoans(cleanCedula);
  if (linkedLoans > 0) {
    throw new AppError(
      409,
      'No se puede eliminar el cliente porque tiene préstamos registrados',
    );
  }

  repository.remove(cleanCedula);

  await sendEvent({
    entity: 'client',
    action: 'DELETE',
    title: 'Cliente eliminado',
    description: `Se eliminó el cliente "${existing.nombre}" (${existing.cedula_cliente})`,
    payload: { cedula_cliente: existing.cedula_cliente, nombre: existing.nombre },
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
