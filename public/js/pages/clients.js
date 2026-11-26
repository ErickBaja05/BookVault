/* ==========================================================================
   Módulo Clientes (listado, formulario crear/editar y eliminación vía API)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', async () => {
  const store = window.BookVaultStore;
  const ui = window.BookVaultUI;
  const validation = window.BookVaultValidation;
  if (!store || !ui || !validation) return;

  const page = document.body.dataset.page;

  if (page === 'clients-list') {
    const searchForm = document.getElementById('search-form');
    const searchInput = document.getElementById('search-query');
    const clearBtn = document.getElementById('btn-clear-search');
    const tbody = document.getElementById('clients-tbody');
    const countEl = document.getElementById('results-count');
    const flashContainer = document.getElementById('flash-container');

    async function renderRows(query = '') {
      try {
        const rows = await store.listClients(query);
        if (countEl) {
          countEl.textContent = `${rows.length} ${rows.length === 1 ? 'cliente' : 'clientes'}`;
        }

        if (rows.length === 0) {
          tbody.innerHTML = `
            <tr>
              <td colspan="6">
                <div class="empty-state">
                  <p class="empty-state-title">No se encontraron clientes</p>
                  <p>Verifique el criterio ingresado o registre un nuevo lector.</p>
                </div>
              </td>
            </tr>
          `;
          return;
        }

        tbody.innerHTML = rows
          .map(
            (client) => `
            <tr>
              <td><span class="mono-code">${ui.escapeHtml(client.cedula_cliente)}</span></td>
              <td class="fw-semibold">${ui.escapeHtml(client.nombre)}</td>
              <td>${ui.escapeHtml(client.correo)}</td>
              <td class="text-muted">${ui.escapeHtml(client.telefono || '—')}</td>
              <td>
                <span class="badge ${client.prestamos_activos > 0 ? 'badge-warning' : 'badge-success'}">
                  ${ui.escapeHtml(client.prestamos_activos)} activos
                </span>
              </td>
              <td>
                <div class="table-actions">
                  <a class="btn btn-outline btn-sm" href="/cliente-form.html?cedula=${encodeURIComponent(client.cedula_cliente)}">Editar</a>
                  <a class="btn btn-danger-outline btn-sm" href="/cliente-eliminar.html?cedula=${encodeURIComponent(client.cedula_cliente)}">Eliminar</a>
                </div>
              </td>
            </tr>
          `,
          )
          .join('');
      } catch (error) {
        ui.showAlert(
          flashContainer,
          'danger',
          ui.getErrorMessage(error, 'No se pudo cargar el listado de clientes.'),
        );
      }
    }

    searchForm.addEventListener('submit', (event) => {
      event.preventDefault();
      renderRows(searchInput.value.trim());
    });

    clearBtn.addEventListener('click', () => {
      searchInput.value = '';
      renderRows('');
      searchInput.focus();
    });

    await renderRows('');
  }

  if (page === 'clients-form') {
    const form = document.getElementById('client-form');
    const titleEl = document.getElementById('form-page-title');
    const subtitleEl = document.getElementById('form-page-subtitle');
    const breadcrumbEl = document.getElementById('breadcrumb-current');
    const submitBtn = document.getElementById('btn-submit');
    const alertBox = document.getElementById('form-alert');

    const cedulaInput = document.getElementById('cliente-cedula');
    const nombreInput = document.getElementById('cliente-nombre');
    const correoInput = document.getElementById('cliente-correo');
    const telefonoInput = document.getElementById('cliente-telefono');
    const direccionInput = document.getElementById('cliente-direccion');

    const cedulaParam = ui.getQueryParam('cedula');
    const isEdit = Boolean(cedulaParam);

    if (isEdit) {
      try {
        const existing = await store.getClient(cedulaParam);
        document.title = 'Editar cliente — BookVault';
        titleEl.textContent = 'Editar cliente';
        subtitleEl.textContent = `Actualice los datos del lector con cédula ${existing.cedula_cliente}.`;
        breadcrumbEl.textContent = 'Editar cliente';
        submitBtn.textContent = 'Guardar cambios';

        cedulaInput.value = existing.cedula_cliente;
        cedulaInput.readOnly = true;
        nombreInput.value = existing.nombre;
        correoInput.value = existing.correo;
        telefonoInput.value = existing.telefono || '';
        direccionInput.value = existing.direccion || '';
      } catch (error) {
        ui.showAlert(
          alertBox,
          'danger',
          ui.getErrorMessage(error, 'No se encontró el cliente solicitado para edición.'),
        );
        form.classList.add('d-none');
        return;
      }
    }

    const { Validators } = validation;

    validation.bindFormValidation(
      form,
      {
        'cliente-cedula': (value) => {
          if (!Validators.isNotBlank(value)) {
            return 'Ingrese el número de cédula del cliente.';
          }
          if (!Validators.isValidCedula(value)) {
            return 'La cédula debe contener solo dígitos (entre 6 y 15 números).';
          }
          return '';
        },
        'cliente-nombre': (value) => {
          if (!Validators.isNotBlank(value)) {
            return 'Ingrese el nombre completo del cliente.';
          }
          if (!Validators.lengthBetween(value, 2, 100)) {
            return 'El nombre debe tener entre 2 y 100 caracteres.';
          }
          if (!Validators.isValidPersonName(value)) {
            return 'El nombre solo debe contener letras, espacios, puntos, apóstrofos o guiones.';
          }
          return '';
        },
        'cliente-correo': (value) => {
          if (!Validators.isNotBlank(value)) {
            return 'Ingrese el correo electrónico del cliente.';
          }
          if (value.trim().length > 120) {
            return 'El correo no puede superar los 120 caracteres.';
          }
          if (!Validators.isValidEmail(value)) {
            return 'Ingrese un correo electrónico válido (ejemplo@dominio.com).';
          }
          return '';
        },
        'cliente-telefono': (value) => {
          if (!Validators.isValidPhone(value)) {
            return 'Ingrese un teléfono válido de 7 a 20 caracteres (solo números, +, -, paréntesis o espacios).';
          }
          return '';
        },
        'cliente-direccion': (value) => {
          if (value.trim().length > 200) {
            return 'La dirección no puede superar los 200 caracteres.';
          }
          return '';
        },
      },
      async () => {
        ui.clearAlert(alertBox);
        submitBtn.disabled = true;

        try {
          const payload = {
            cedula_cliente: cedulaInput.value,
            nombre: nombreInput.value,
            correo: correoInput.value,
            telefono: telefonoInput.value,
            direccion: direccionInput.value,
          };

          if (isEdit) {
            await store.updateClient(cedulaParam, payload);
            ui.setFlash('success', `Cliente "${payload.nombre.trim()}" actualizado correctamente.`);
          } else {
            await store.createClient(payload);
            ui.setFlash('success', `Cliente "${payload.nombre.trim()}" registrado correctamente.`);
          }

          window.location.href = '/clientes.html';
        } catch (error) {
          ui.showAlert(alertBox, 'danger', ui.getErrorMessage(error));
          submitBtn.disabled = false;
        }
      },
    );
  }

  if (page === 'clients-delete') {
    const cedula = ui.getQueryParam('cedula');
    const alertBox = document.getElementById('delete-alert');
    const card = document.getElementById('delete-card');
    const summaryEl = document.getElementById('delete-summary');
    const form = document.getElementById('delete-form');
    const checkbox = document.getElementById('confirm-delete');
    const submitBtn = document.getElementById('btn-confirm-delete');

    if (!cedula) {
      ui.showAlert(alertBox, 'danger', 'No se especificó el cliente a eliminar.');
      card.classList.add('d-none');
      return;
    }

    let item;
    try {
      item = await store.getClient(cedula);
    } catch (error) {
      ui.showAlert(alertBox, 'danger', ui.getErrorMessage(error, 'Cliente no encontrado.'));
      card.classList.add('d-none');
      return;
    }

    summaryEl.innerHTML = `
      <div class="confirm-dl-item">
        <dt>Cédula</dt>
        <dd>${ui.escapeHtml(item.cedula_cliente)}</dd>
      </div>
      <div class="confirm-dl-item">
        <dt>Nombre completo</dt>
        <dd>${ui.escapeHtml(item.nombre)}</dd>
      </div>
      <div class="confirm-dl-item">
        <dt>Correo electrónico</dt>
        <dd>${ui.escapeHtml(item.correo)}</dd>
      </div>
      <div class="confirm-dl-item">
        <dt>Teléfono</dt>
        <dd>${ui.escapeHtml(item.telefono || 'No registrado')}</dd>
      </div>
    `;

    checkbox.addEventListener('change', () => {
      submitBtn.disabled = !checkbox.checked;
      if (checkbox.checked) {
        validation.clearFieldError(checkbox);
      }
    });

    validation.bindFormValidation(
      form,
      {
        'confirm-delete': (_val, input) => {
          if (!input.checked) {
            return 'Debe marcar la casilla de confirmación antes de eliminar.';
          }
          return '';
        },
      },
      async () => {
        ui.clearAlert(alertBox);
        submitBtn.disabled = true;

        try {
          await store.deleteClient(cedula);
          ui.setFlash('warning', `Cliente "${item.nombre}" eliminado del registro.`);
          window.location.href = '/clientes.html';
        } catch (error) {
          ui.showAlert(alertBox, 'danger', ui.getErrorMessage(error));
          submitBtn.disabled = !checkbox.checked;
        }
      },
    );
  }
});
