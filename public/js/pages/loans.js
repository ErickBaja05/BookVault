/* ==========================================================================
   Módulo Préstamos (consulta de activos e historial, registro de nuevo
   préstamo y registro de devolución — sin edición ni eliminación)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  const store = window.BookVaultStore;
  const ui = window.BookVaultUI;
  const validation = window.BookVaultValidation;
  if (!store || !ui || !validation) return;

  const page = document.body.dataset.page;

  if (page === 'loans-list') {
    const searchForm = document.getElementById('search-form');
    const searchInput = document.getElementById('search-query');
    const statusSelect = document.getElementById('filter-status');
    const clearBtn = document.getElementById('btn-clear-search');
    const tbody = document.getElementById('loans-tbody');
    const countEl = document.getElementById('results-count');

    const initialStatus = ui.getQueryParam('status');
    if (initialStatus && ['ACTIVE', 'RETURNED'].includes(initialStatus.toUpperCase())) {
      statusSelect.value = initialStatus.toUpperCase();
    }

    function renderRows() {
      const rows = store.listLoans({
        q: searchInput.value.trim(),
        status: statusSelect.value,
      });

      if (countEl) {
        countEl.textContent = `${rows.length} ${rows.length === 1 ? 'préstamo' : 'préstamos'}`;
      }

      if (rows.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="7">
              <div class="empty-state">
                <p class="empty-state-title">No se encontraron préstamos</p>
                <p>Pruebe cambiando los filtros o registre un nuevo préstamo de ejemplar.</p>
              </div>
            </td>
          </tr>
        `;
        return;
      }

      tbody.innerHTML = rows
        .map((loan) => {
          const isActive = loan.estado === 'ACTIVE';
          const statusBadge = isActive
            ? '<span class="badge badge-warning">Activo</span>'
            : '<span class="badge badge-success">Devuelto</span>';

          const actionCell = isActive
            ? `<a class="btn btn-success btn-sm" href="/prestamo-devolver.html?id=${encodeURIComponent(loan.cod_prestamo)}">Registrar devolución</a>`
            : `<span class="fs-xs text-muted">Entregado el ${ui.escapeHtml(ui.formatDate(loan.fecha_devolucion))}</span>`;

          return `
            <tr>
              <td><span class="mono-code">#${ui.escapeHtml(loan.cod_prestamo)}</span></td>
              <td>
                <div class="fw-semibold">${ui.escapeHtml(loan.libro_titulo)}</div>
                <div class="fs-xs text-muted">${ui.escapeHtml(loan.isbn)}</div>
              </td>
              <td>
                <div class="fw-semibold">${ui.escapeHtml(loan.cliente_nombre)}</div>
                <div class="fs-xs text-muted">CI: ${ui.escapeHtml(loan.cedula_cliente)}</div>
              </td>
              <td>${ui.escapeHtml(ui.formatDate(loan.fecha_prestamo))}</td>
              <td>${ui.escapeHtml(ui.formatDate(loan.fecha_limite))}</td>
              <td>${statusBadge}</td>
              <td>${actionCell}</td>
            </tr>
          `;
        })
        .join('');
    }

    searchForm.addEventListener('submit', (event) => {
      event.preventDefault();
      renderRows();
    });

    clearBtn.addEventListener('click', () => {
      searchInput.value = '';
      statusSelect.value = 'ALL';
      renderRows();
      searchInput.focus();
    });

    renderRows();
  }

  if (page === 'loans-form') {
    const form = document.getElementById('loan-form');
    const bookSelect = document.getElementById('prestamo-libro');
    const clientSelect = document.getElementById('prestamo-cliente');
    const fechaPrestamoInput = document.getElementById('prestamo-fecha');
    const fechaLimiteInput = document.getElementById('prestamo-fecha-limite');

    const books = store.listBooks();
    books.forEach((book) => {
      const opt = document.createElement('option');
      opt.value = book.isbn;
      opt.textContent = `${book.titulo} (${book.isbn}) — ${book.copias_disponibles} disp.`;
      bookSelect.appendChild(opt);
    });

    const clients = store.listClients();
    clients.forEach((client) => {
      const opt = document.createElement('option');
      opt.value = client.cedula_cliente;
      opt.textContent = `${client.nombre} — CI: ${client.cedula_cliente}`;
      clientSelect.appendChild(opt);
    });

    const today = ui.getTodayISO();
    fechaPrestamoInput.value = today;
    fechaLimiteInput.min = today;
    fechaLimiteInput.value = ui.addDaysISO(today, 14);

    fechaPrestamoInput.addEventListener('change', () => {
      if (fechaPrestamoInput.value) {
        fechaLimiteInput.min = fechaPrestamoInput.value;
        if (fechaLimiteInput.dataset.touched === 'true') {
          validation.validateField(fechaLimiteInput, validateFechaLimite);
        }
      }
    });

    const { Validators } = validation;

    function validateFechaLimite(value) {
      if (!Validators.isNotBlank(value)) {
        return 'Seleccione la fecha límite de devolución.';
      }
      if (!Validators.isValidDate(value)) {
        return 'Ingrese una fecha válida.';
      }
      if (fechaPrestamoInput.value && value < fechaPrestamoInput.value) {
        return 'La fecha límite debe ser igual o posterior a la fecha de préstamo.';
      }
      return '';
    }

    validation.bindFormValidation(
      form,
      {
        'prestamo-libro': (value) => {
          if (!Validators.isNotBlank(value)) {
            return 'Seleccione un libro del catálogo.';
          }
          return '';
        },
        'prestamo-cliente': (value) => {
          if (!Validators.isNotBlank(value)) {
            return 'Seleccione el cliente que solicita el préstamo.';
          }
          return '';
        },
        'prestamo-fecha': (value) => {
          if (!Validators.isNotBlank(value)) {
            return 'Seleccione la fecha del préstamo.';
          }
          if (!Validators.isValidDate(value)) {
            return 'Ingrese una fecha válida.';
          }
          return '';
        },
        'prestamo-fecha-limite': validateFechaLimite,
      },
      () => {
        const created = store.createLoan({
          isbn: bookSelect.value,
          cedula_cliente: clientSelect.value,
          fecha_prestamo: fechaPrestamoInput.value,
          fecha_limite: fechaLimiteInput.value,
        });

        ui.setFlash(
          'success',
          `Préstamo #${created.cod_prestamo} registrado correctamente (estado: Activo).`,
        );
        window.location.href = '/prestamos.html';
      },
    );
  }

  if (page === 'loans-return') {
    const id = ui.getQueryParam('id');
    const loan = id ? store.getLoan(id) : null;
    const alertBox = document.getElementById('return-alert');
    const card = document.getElementById('return-card');
    const summaryEl = document.getElementById('return-summary');
    const form = document.getElementById('return-form');
    const fechaDevInput = document.getElementById('devolucion-fecha');
    const checkbox = document.getElementById('confirm-return');
    const submitBtn = document.getElementById('btn-confirm-return');

    if (!loan) {
      ui.showAlert(alertBox, 'danger', 'No se encontró el préstamo solicitado.');
      card.classList.add('d-none');
      return;
    }

    summaryEl.innerHTML = `
      <div class="confirm-dl-item">
        <dt>Código de préstamo</dt>
        <dd>#${ui.escapeHtml(loan.cod_prestamo)}</dd>
      </div>
      <div class="confirm-dl-item">
        <dt>Estado actual</dt>
        <dd>${loan.estado === 'ACTIVE' ? '<span class="badge badge-warning">Activo</span>' : '<span class="badge badge-success">Devuelto</span>'}</dd>
      </div>
      <div class="confirm-dl-item">
        <dt>Libro</dt>
        <dd>${ui.escapeHtml(loan.libro_titulo)} (${ui.escapeHtml(loan.isbn)})</dd>
      </div>
      <div class="confirm-dl-item">
        <dt>Cliente</dt>
        <dd>${ui.escapeHtml(loan.cliente_nombre)} — CI: ${ui.escapeHtml(loan.cedula_cliente)}</dd>
      </div>
      <div class="confirm-dl-item">
        <dt>Fecha de préstamo</dt>
        <dd>${ui.escapeHtml(ui.formatDate(loan.fecha_prestamo))}</dd>
      </div>
      <div class="confirm-dl-item">
        <dt>Fecha límite</dt>
        <dd>${ui.escapeHtml(ui.formatDate(loan.fecha_limite))}</dd>
      </div>
    `;

    if (loan.estado !== 'ACTIVE') {
      ui.showAlert(
        alertBox,
        'info',
        `Este préstamo ya fue devuelto el ${ui.formatDate(loan.fecha_devolucion)}.`,
      );
      form.classList.add('d-none');
      return;
    }

    fechaDevInput.value = ui.getTodayISO();
    fechaDevInput.min = loan.fecha_prestamo;

    checkbox.addEventListener('change', () => {
      submitBtn.disabled = !checkbox.checked;
      if (checkbox.checked) {
        validation.clearFieldError(checkbox);
      }
    });

    const { Validators } = validation;

    validation.bindFormValidation(
      form,
      {
        'devolucion-fecha': (value) => {
          if (!Validators.isNotBlank(value) || !Validators.isValidDate(value)) {
            return 'Ingrese una fecha de devolución válida.';
          }
          if (value < loan.fecha_prestamo) {
            return 'La fecha de devolución no puede ser anterior a la fecha del préstamo.';
          }
          return '';
        },
        'confirm-return': (_val, input) => {
          if (!input.checked) {
            return 'Confirme la recepción física del ejemplar antes de continuar.';
          }
          return '';
        },
      },
      () => {
        store.returnLoan(id, fechaDevInput.value);
        ui.setFlash(
          'success',
          `Devolución del préstamo #${loan.cod_prestamo} registrada correctamente.`,
        );
        window.location.href = '/prestamos.html';
      },
    );
  }
});
