/* ==========================================================================
   Módulo Autores (listado, formulario crear/editar y eliminación vía API)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', async () => {
  const store = window.BookVaultStore;
  const ui = window.BookVaultUI;
  const validation = window.BookVaultValidation;
  if (!store || !ui || !validation) return;

  const page = document.body.dataset.page;

  if (page === 'authors-list') {
    const searchForm = document.getElementById('search-form');
    const searchInput = document.getElementById('search-query');
    const clearBtn = document.getElementById('btn-clear-search');
    const tbody = document.getElementById('authors-tbody');
    const countEl = document.getElementById('results-count');
    const flashContainer = document.getElementById('flash-container');

    async function renderRows(query = '') {
      try {
        const rows = await store.listAuthors(query);
        if (countEl) {
          countEl.textContent = `${rows.length} ${rows.length === 1 ? 'autor' : 'autores'}`;
        }

        if (rows.length === 0) {
          tbody.innerHTML = `
            <tr>
              <td colspan="5">
                <div class="empty-state">
                  <p class="empty-state-title">No se encontraron autores</p>
                  <p>Pruebe con otro criterio de búsqueda o registre un nuevo autor.</p>
                </div>
              </td>
            </tr>
          `;
          return;
        }

        tbody.innerHTML = rows
          .map(
            (author) => `
            <tr>
              <td><span class="mono-code">#${ui.escapeHtml(author.cod_autor)}</span></td>
              <td class="fw-semibold">${ui.escapeHtml(author.nombre)}</td>
              <td class="text-muted">${ui.escapeHtml(author.nacionalidad || 'No registrada')}</td>
              <td><span class="badge badge-warning">${ui.escapeHtml(author.libros_count)} obras</span></td>
              <td>
                <div class="table-actions">
                  <a class="btn btn-outline btn-sm" href="/autor-form.html?id=${encodeURIComponent(author.cod_autor)}">Editar</a>
                  <a class="btn btn-danger-outline btn-sm" href="/autor-eliminar.html?id=${encodeURIComponent(author.cod_autor)}">Eliminar</a>
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
          ui.getErrorMessage(error, 'No se pudo cargar el listado de autores.'),
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

  if (page === 'authors-form') {
    const form = document.getElementById('author-form');
    const titleEl = document.getElementById('form-page-title');
    const subtitleEl = document.getElementById('form-page-subtitle');
    const breadcrumbEl = document.getElementById('breadcrumb-current');
    const submitBtn = document.getElementById('btn-submit');
    const nameInput = document.getElementById('autor-nombre');
    const nationalityInput = document.getElementById('autor-nacionalidad');
    const alertBox = document.getElementById('form-alert');

    const id = ui.getQueryParam('id');
    const isEdit = Boolean(id);

    if (isEdit) {
      try {
        const existing = await store.getAuthor(id);
        document.title = 'Editar autor — BookVault';
        titleEl.textContent = 'Editar autor';
        subtitleEl.textContent = `Actualice los datos del autor #${existing.cod_autor}.`;
        breadcrumbEl.textContent = 'Editar autor';
        submitBtn.textContent = 'Guardar cambios';
        nameInput.value = existing.nombre;
        nationalityInput.value = existing.nacionalidad || '';
      } catch (error) {
        ui.showAlert(
          alertBox,
          'danger',
          ui.getErrorMessage(error, 'No se encontró el autor solicitado para edición.'),
        );
        form.classList.add('d-none');
        return;
      }
    }

    const { Validators } = validation;

    validation.bindFormValidation(
      form,
      {
        'autor-nombre': (value) => {
          if (!Validators.isNotBlank(value)) {
            return 'Ingrese el nombre completo del autor.';
          }
          if (!Validators.lengthBetween(value, 2, 100)) {
            return 'El nombre debe tener entre 2 y 100 caracteres.';
          }
          if (!Validators.isValidPersonName(value)) {
            return 'El nombre solo debe contener letras, espacios, puntos, apóstrofos o guiones.';
          }
          return '';
        },
        'autor-nacionalidad': (value) => {
          const trimmed = value.trim();
          if (!trimmed) return '';
          if (!Validators.lengthBetween(trimmed, 2, 60)) {
            return 'La nacionalidad debe tener entre 2 y 60 caracteres.';
          }
          if (!Validators.isValidPersonName(trimmed)) {
            return 'La nacionalidad solo debe contener letras, espacios o guiones.';
          }
          return '';
        },
      },
      async () => {
        ui.clearAlert(alertBox);
        submitBtn.disabled = true;

        try {
          const payload = {
            nombre: nameInput.value,
            nacionalidad: nationalityInput.value,
          };

          if (isEdit) {
            await store.updateAuthor(id, payload);
            ui.setFlash('success', `Autor "${payload.nombre.trim()}" actualizado correctamente.`);
          } else {
            await store.createAuthor(payload);
            ui.setFlash('success', `Autor "${payload.nombre.trim()}" registrado correctamente.`);
          }

          window.location.href = '/autores.html';
        } catch (error) {
          ui.showAlert(alertBox, 'danger', ui.getErrorMessage(error));
          submitBtn.disabled = false;
        }
      },
    );
  }

  if (page === 'authors-delete') {
    const id = ui.getQueryParam('id');
    const alertBox = document.getElementById('delete-alert');
    const card = document.getElementById('delete-card');
    const summaryEl = document.getElementById('delete-summary');
    const form = document.getElementById('delete-form');
    const checkbox = document.getElementById('confirm-delete');
    const submitBtn = document.getElementById('btn-confirm-delete');

    if (!id) {
      ui.showAlert(alertBox, 'danger', 'No se especificó el autor a eliminar.');
      card.classList.add('d-none');
      return;
    }

    let item;
    try {
      item = await store.getAuthor(id);
    } catch (error) {
      ui.showAlert(alertBox, 'danger', ui.getErrorMessage(error, 'Autor no encontrado.'));
      card.classList.add('d-none');
      return;
    }

    summaryEl.innerHTML = `
      <div class="confirm-dl-item">
        <dt>Código</dt>
        <dd>#${ui.escapeHtml(item.cod_autor)}</dd>
      </div>
      <div class="confirm-dl-item">
        <dt>Nombre</dt>
        <dd>${ui.escapeHtml(item.nombre)}</dd>
      </div>
      <div class="confirm-dl-item">
        <dt>Nacionalidad</dt>
        <dd>${ui.escapeHtml(item.nacionalidad || 'No registrada')}</dd>
      </div>
      <div class="confirm-dl-item">
        <dt>Obras vinculadas</dt>
        <dd>${ui.escapeHtml(item.libros_count)}</dd>
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
          await store.deleteAuthor(id);
          ui.setFlash('warning', `Autor "${item.nombre}" eliminado del listado.`);
          window.location.href = '/autores.html';
        } catch (error) {
          ui.showAlert(alertBox, 'danger', ui.getErrorMessage(error));
          submitBtn.disabled = !checkbox.checked;
        }
      },
    );
  }
});
