/* ==========================================================================
   Módulo Categorías (listado, formulario crear/editar y eliminación vía API)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', async () => {
  const store = window.BookVaultStore;
  const ui = window.BookVaultUI;
  const validation = window.BookVaultValidation;
  if (!store || !ui || !validation) return;

  const page = document.body.dataset.page;

  if (page === 'categories-list') {
    const searchForm = document.getElementById('search-form');
    const searchInput = document.getElementById('search-query');
    const clearBtn = document.getElementById('btn-clear-search');
    const tbody = document.getElementById('categories-tbody');
    const countEl = document.getElementById('results-count');
    const flashContainer = document.getElementById('flash-container');

    async function renderRows(query = '') {
      try {
        const rows = await store.listCategories(query);
        if (countEl) {
          countEl.textContent = `${rows.length} ${rows.length === 1 ? 'categoría' : 'categorías'}`;
        }

        if (rows.length === 0) {
          tbody.innerHTML = `
            <tr>
              <td colspan="5">
                <div class="empty-state">
                  <p class="empty-state-title">No se encontraron categorías</p>
                  <p>Intente con otro término de búsqueda o registre una nueva categoría.</p>
                </div>
              </td>
            </tr>
          `;
          return;
        }

        tbody.innerHTML = rows
          .map(
            (cat) => `
            <tr>
              <td><span class="mono-code">#${ui.escapeHtml(cat.cod_categoria)}</span></td>
              <td class="fw-semibold">${ui.escapeHtml(cat.nombre)}</td>
              <td class="text-muted">${ui.escapeHtml(cat.descripcion || 'Sin descripción')}</td>
              <td><span class="badge badge-primary">${ui.escapeHtml(cat.libros_count)} libros</span></td>
              <td>
                <div class="table-actions">
                  <a class="btn btn-outline btn-sm" href="/categoria-form.html?id=${encodeURIComponent(cat.cod_categoria)}">Editar</a>
                  <a class="btn btn-danger-outline btn-sm" href="/categoria-eliminar.html?id=${encodeURIComponent(cat.cod_categoria)}">Eliminar</a>
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
          ui.getErrorMessage(error, 'No se pudo cargar el listado de categorías.'),
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

  if (page === 'categories-form') {
    const form = document.getElementById('category-form');
    const titleEl = document.getElementById('form-page-title');
    const subtitleEl = document.getElementById('form-page-subtitle');
    const breadcrumbEl = document.getElementById('breadcrumb-current');
    const submitBtn = document.getElementById('btn-submit');
    const nameInput = document.getElementById('categoria-nombre');
    const descInput = document.getElementById('categoria-descripcion');
    const descCounter = document.getElementById('descripcion-counter');
    const alertBox = document.getElementById('form-alert');

    const id = ui.getQueryParam('id');
    const isEdit = Boolean(id);

    if (isEdit) {
      try {
        const existing = await store.getCategory(id);
        document.title = 'Editar categoría — BookVault';
        titleEl.textContent = 'Editar categoría';
        subtitleEl.textContent = `Actualice los datos de la categoría #${existing.cod_categoria}.`;
        breadcrumbEl.textContent = 'Editar categoría';
        submitBtn.textContent = 'Guardar cambios';
        nameInput.value = existing.nombre;
        descInput.value = existing.descripcion || '';
      } catch (error) {
        ui.showAlert(
          alertBox,
          'danger',
          ui.getErrorMessage(error, 'No se encontró la categoría solicitada para edición.'),
        );
        form.classList.add('d-none');
        return;
      }
    }

    function updateCounter() {
      if (descCounter) {
        descCounter.textContent = `${descInput.value.length} / 300 caracteres`;
      }
    }
    descInput.addEventListener('input', updateCounter);
    updateCounter();

    const { Validators } = validation;

    validation.bindFormValidation(
      form,
      {
        'categoria-nombre': (value) => {
          if (!Validators.isNotBlank(value)) {
            return 'Ingrese el nombre de la categoría.';
          }
          if (!Validators.lengthBetween(value, 2, 80)) {
            return 'El nombre debe tener entre 2 y 80 caracteres.';
          }
          return '';
        },
        'categoria-descripcion': (value) => {
          if (value.trim().length > 300) {
            return 'La descripción no puede superar los 300 caracteres.';
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
            descripcion: descInput.value,
          };

          if (isEdit) {
            await store.updateCategory(id, payload);
            ui.setFlash('success', `Categoría "${payload.nombre.trim()}" actualizada correctamente.`);
          } else {
            await store.createCategory(payload);
            ui.setFlash('success', `Categoría "${payload.nombre.trim()}" registrada correctamente.`);
          }

          window.location.href = '/categorias.html';
        } catch (error) {
          ui.showAlert(alertBox, 'danger', ui.getErrorMessage(error));
          submitBtn.disabled = false;
        }
      },
    );
  }

  if (page === 'categories-delete') {
    const id = ui.getQueryParam('id');
    const alertBox = document.getElementById('delete-alert');
    const card = document.getElementById('delete-card');
    const summaryEl = document.getElementById('delete-summary');
    const form = document.getElementById('delete-form');
    const checkbox = document.getElementById('confirm-delete');
    const submitBtn = document.getElementById('btn-confirm-delete');

    if (!id) {
      ui.showAlert(alertBox, 'danger', 'No se especificó la categoría a eliminar.');
      card.classList.add('d-none');
      return;
    }

    let item;
    try {
      item = await store.getCategory(id);
    } catch (error) {
      ui.showAlert(alertBox, 'danger', ui.getErrorMessage(error, 'Categoría no encontrada.'));
      card.classList.add('d-none');
      return;
    }

    summaryEl.innerHTML = `
      <div class="confirm-dl-item">
        <dt>Código</dt>
        <dd>#${ui.escapeHtml(item.cod_categoria)}</dd>
      </div>
      <div class="confirm-dl-item">
        <dt>Nombre</dt>
        <dd>${ui.escapeHtml(item.nombre)}</dd>
      </div>
      <div class="confirm-dl-item">
        <dt>Descripción</dt>
        <dd>${ui.escapeHtml(item.descripcion || 'Sin descripción')}</dd>
      </div>
      <div class="confirm-dl-item">
        <dt>Libros asociados</dt>
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
          await store.deleteCategory(id);
          ui.setFlash('warning', `Categoría "${item.nombre}" eliminada del listado.`);
          window.location.href = '/categorias.html';
        } catch (error) {
          ui.showAlert(alertBox, 'danger', ui.getErrorMessage(error));
          submitBtn.disabled = !checkbox.checked;
        }
      },
    );
  }
});
