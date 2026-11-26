/* ==========================================================================
   Módulo Libros (listado con filtros combinables, crear/editar con autoría
   múltiple y confirmación de eliminación)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  const store = window.BookVaultStore;
  const ui = window.BookVaultUI;
  const validation = window.BookVaultValidation;
  if (!store || !ui || !validation) return;

  const page = document.body.dataset.page;

  if (page === 'books-list') {
    const searchForm = document.getElementById('search-form');
    const searchInput = document.getElementById('search-query');
    const categorySelect = document.getElementById('filter-category');
    const authorSelect = document.getElementById('filter-author');
    const availableCheckbox = document.getElementById('filter-available');
    const clearBtn = document.getElementById('btn-clear-search');
    const tbody = document.getElementById('books-tbody');
    const countEl = document.getElementById('results-count');

    const categories = store.listCategories();
    categories.forEach((cat) => {
      const opt = document.createElement('option');
      opt.value = String(cat.cod_categoria);
      opt.textContent = cat.nombre;
      categorySelect.appendChild(opt);
    });

    const authors = store.listAuthors();
    authors.forEach((author) => {
      const opt = document.createElement('option');
      opt.value = String(author.cod_autor);
      opt.textContent = author.nombre;
      authorSelect.appendChild(opt);
    });

    function renderRows() {
      const rows = store.listBooks({
        q: searchInput.value.trim(),
        category: categorySelect.value,
        author: authorSelect.value,
        available: availableCheckbox.checked,
      });

      if (countEl) {
        countEl.textContent = `${rows.length} ${rows.length === 1 ? 'libro' : 'libros'}`;
      }

      if (rows.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="7">
              <div class="empty-state">
                <p class="empty-state-title">No se encontraron libros</p>
                <p>Ajuste los filtros de búsqueda o registre un nuevo título en el catálogo.</p>
              </div>
            </td>
          </tr>
        `;
        return;
      }

      tbody.innerHTML = rows
        .map((book) => {
          const authorsHtml = book.autores_detalle
            .map((a) => {
              const roleBadge =
                a.rol === 'COAUTOR'
                  ? '<span class="badge badge-neutral">Coautor</span>'
                  : '<span class="badge badge-warning">Principal</span>';
              return `<div class="d-flex items-center gap-1 flex-wrap"><span>${ui.escapeHtml(a.nombre)}</span> ${roleBadge}</div>`;
            })
            .join('');

          const stockClass =
            book.copias_disponibles > 0 ? 'badge-success' : 'badge-danger';
          const stockText =
            book.copias_disponibles > 0
              ? `${book.copias_disponibles} / ${book.cantidad_total} disp.`
              : `0 / ${book.cantidad_total} agotado`;

          return `
            <tr>
              <td><span class="mono-code">${ui.escapeHtml(book.isbn)}</span></td>
              <td class="fw-semibold">${ui.escapeHtml(book.titulo)}</td>
              <td><span class="badge badge-primary">${ui.escapeHtml(book.categoria_nombre)}</span></td>
              <td><div class="d-flex flex-column gap-1">${authorsHtml}</div></td>
              <td>${ui.escapeHtml(book.anio_publicacion)}</td>
              <td><span class="badge ${stockClass}">${ui.escapeHtml(stockText)}</span></td>
              <td>
                <div class="table-actions">
                  <a class="btn btn-outline btn-sm" href="/libro-form.html?isbn=${encodeURIComponent(book.isbn)}">Editar</a>
                  <a class="btn btn-danger-outline btn-sm" href="/libro-eliminar.html?isbn=${encodeURIComponent(book.isbn)}">Eliminar</a>
                </div>
              </td>
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
      categorySelect.value = '';
      authorSelect.value = '';
      availableCheckbox.checked = false;
      renderRows();
      searchInput.focus();
    });

    renderRows();
  }

  if (page === 'books-form') {
    const form = document.getElementById('book-form');
    const titleEl = document.getElementById('form-page-title');
    const subtitleEl = document.getElementById('form-page-subtitle');
    const breadcrumbEl = document.getElementById('breadcrumb-current');
    const submitBtn = document.getElementById('btn-submit');
    const alertBox = document.getElementById('form-alert');

    const isbnInput = document.getElementById('libro-isbn');
    const tituloInput = document.getElementById('libro-titulo');
    const categoriaSelect = document.getElementById('libro-categoria');
    const anioInput = document.getElementById('libro-anio');
    const cantidadInput = document.getElementById('libro-cantidad');
    const authorsContainer = document.getElementById('authors-rows');
    const authorsErrorEl = document.getElementById('libro-autores-error');
    const addAuthorBtn = document.getElementById('btn-add-author');

    const categories = store.listCategories();
    const authors = store.listAuthors();

    categories.forEach((cat) => {
      const opt = document.createElement('option');
      opt.value = String(cat.cod_categoria);
      opt.textContent = cat.nombre;
      categoriaSelect.appendChild(opt);
    });

    const isbnParam = ui.getQueryParam('isbn');
    const isEdit = Boolean(isbnParam);
    const existing = isEdit ? store.getBook(isbnParam) : null;

    if (isEdit && !existing) {
      ui.showAlert(alertBox, 'danger', 'No se encontró el libro solicitado para edición.');
      form.classList.add('d-none');
      return;
    }

    function createAuthorRow(selectedAuthorId = '', selectedRole = 'PRINCIPAL') {
      const row = document.createElement('div');
      row.className = 'author-row';

      const optionsHtml = [
        '<option value="">Seleccione un autor...</option>',
        ...authors.map(
          (a) =>
            `<option value="${ui.escapeHtml(a.cod_autor)}" ${
              String(a.cod_autor) === String(selectedAuthorId) ? 'selected' : ''
            }>${ui.escapeHtml(a.nombre)}</option>`,
        ),
      ].join('');

      row.innerHTML = `
        <div class="form-group m-0">
          <label class="form-label required">Autor</label>
          <select class="form-select author-select" required>
            ${optionsHtml}
          </select>
        </div>
        <div class="form-group m-0">
          <label class="form-label required">Rol</label>
          <select class="form-select author-role-select" required>
            <option value="PRINCIPAL" ${selectedRole === 'PRINCIPAL' ? 'selected' : ''}>Principal</option>
            <option value="COAUTOR" ${selectedRole === 'COAUTOR' ? 'selected' : ''}>Coautor</option>
          </select>
        </div>
        <div>
          <button type="button" class="btn btn-danger-outline btn-sm btn-remove-author">Quitar</button>
        </div>
      `;

      const removeBtn = row.querySelector('.btn-remove-author');
      removeBtn.addEventListener('click', () => {
        if (authorsContainer.children.length > 1) {
          row.remove();
          refreshRemoveButtons();
          validateAuthorsGroup();
        }
      });

      row.querySelector('.author-select').addEventListener('change', () => {
        validateAuthorsGroup();
      });

      authorsContainer.appendChild(row);
      refreshRemoveButtons();
    }

    function refreshRemoveButtons() {
      const buttons = authorsContainer.querySelectorAll('.btn-remove-author');
      buttons.forEach((btn) => {
        btn.disabled = buttons.length <= 1;
      });
    }

    function readAuthorsFromUI() {
      const rows = Array.from(authorsContainer.querySelectorAll('.author-row'));
      return rows.map((row) => ({
        cod_autor: row.querySelector('.author-select').value,
        rol: row.querySelector('.author-role-select').value,
      }));
    }

    function validateAuthorsGroup() {
      const items = readAuthorsFromUI();
      let error = '';

      if (items.length === 0) {
        error = 'Debe seleccionar al menos un autor para el libro.';
      } else if (items.some((item) => !item.cod_autor)) {
        error = 'Complete la selección de autor en todas las filas agregadas.';
      } else {
        const ids = items.map((item) => item.cod_autor);
        if (new Set(ids).size !== ids.length) {
          error = 'No repita el mismo autor en dos filas distintas.';
        }
      }

      if (error) {
        authorsErrorEl.textContent = error;
        authorsErrorEl.classList.add('visible');
        return false;
      }

      authorsErrorEl.textContent = '';
      authorsErrorEl.classList.remove('visible');
      return true;
    }

    addAuthorBtn.addEventListener('click', () => {
      const defaultRole = authorsContainer.children.length === 0 ? 'PRINCIPAL' : 'COAUTOR';
      createAuthorRow('', defaultRole);
    });

    if (isEdit) {
      document.title = 'Editar libro — BookVault';
      titleEl.textContent = 'Editar libro';
      subtitleEl.textContent = `Actualice los datos del libro con ISBN ${existing.isbn}.`;
      breadcrumbEl.textContent = 'Editar libro';
      submitBtn.textContent = 'Guardar cambios';

      isbnInput.value = existing.isbn;
      isbnInput.readOnly = true;
      tituloInput.value = existing.titulo;
      categoriaSelect.value = String(existing.cod_categoria);
      anioInput.value = String(existing.anio_publicacion);
      cantidadInput.value = String(existing.cantidad_total);

      if (existing.autores && existing.autores.length > 0) {
        existing.autores.forEach((rel) => createAuthorRow(rel.cod_autor, rel.rol));
      } else {
        createAuthorRow('', 'PRINCIPAL');
      }
    } else {
      createAuthorRow('', 'PRINCIPAL');
    }

    const { Validators } = validation;
    const currentYear = new Date().getFullYear();

    validation.bindFormValidation(
      form,
      {
        'libro-isbn': (value) => {
          if (!Validators.isNotBlank(value)) {
            return 'Ingrese el código ISBN del libro.';
          }
          if (!Validators.isValidISBN(value)) {
            return 'Ingrese un ISBN-10 o ISBN-13 válido (10 o 13 dígitos, guiones opcionales).';
          }
          return '';
        },
        'libro-titulo': (value) => {
          if (!Validators.isNotBlank(value)) {
            return 'Ingrese el título del libro.';
          }
          if (!Validators.lengthBetween(value, 1, 150)) {
            return 'El título debe tener entre 1 y 150 caracteres.';
          }
          return '';
        },
        'libro-categoria': (value) => {
          if (!Validators.isNotBlank(value)) {
            return 'Seleccione una categoría.';
          }
          return '';
        },
        'libro-anio': (value) => {
          if (!Validators.isNotBlank(value)) {
            return 'Ingrese el año de publicación.';
          }
          if (!Validators.isValidYear(value, 1000, currentYear)) {
            return `Ingrese un año válido de 4 dígitos entre 1000 y ${currentYear}.`;
          }
          return '';
        },
        'libro-cantidad': (value) => {
          if (!Validators.isNotBlank(value)) {
            return 'Ingrese la cantidad total de ejemplares.';
          }
          if (!Validators.isPositiveInteger(value, 1, 9999)) {
            return 'Ingrese un número entero mayor o igual a 1.';
          }
          return '';
        },
      },
      () => {
        if (!validateAuthorsGroup()) {
          const firstSelect = authorsContainer.querySelector('.author-select');
          if (firstSelect) firstSelect.focus();
          return;
        }

        const payload = {
          isbn: isbnInput.value,
          titulo: tituloInput.value,
          cod_categoria: categoriaSelect.value,
          anio_publicacion: anioInput.value,
          cantidad_total: cantidadInput.value,
          autores: readAuthorsFromUI(),
        };

        if (isEdit) {
          store.updateBook(isbnParam, payload);
          ui.setFlash('success', `Libro "${payload.titulo.trim()}" actualizado correctamente.`);
        } else {
          store.createBook(payload);
          ui.setFlash('success', `Libro "${payload.titulo.trim()}" registrado correctamente.`);
        }

        window.location.href = '/libros.html';
      },
    );
  }

  if (page === 'books-delete') {
    const isbn = ui.getQueryParam('isbn');
    const item = isbn ? store.getBook(isbn) : null;
    const alertBox = document.getElementById('delete-alert');
    const card = document.getElementById('delete-card');
    const summaryEl = document.getElementById('delete-summary');
    const form = document.getElementById('delete-form');
    const checkbox = document.getElementById('confirm-delete');
    const submitBtn = document.getElementById('btn-confirm-delete');

    if (!item) {
      ui.showAlert(alertBox, 'danger', 'No se encontró el libro seleccionado.');
      card.classList.add('d-none');
      return;
    }

    const authorsText = item.autores_detalle
      .map((a) => `${a.nombre} (${a.rol === 'COAUTOR' ? 'Coautor' : 'Principal'})`)
      .join(', ');

    summaryEl.innerHTML = `
      <div class="confirm-dl-item">
        <dt>ISBN</dt>
        <dd>${ui.escapeHtml(item.isbn)}</dd>
      </div>
      <div class="confirm-dl-item">
        <dt>Título</dt>
        <dd>${ui.escapeHtml(item.titulo)}</dd>
      </div>
      <div class="confirm-dl-item">
        <dt>Categoría</dt>
        <dd>${ui.escapeHtml(item.categoria_nombre)}</dd>
      </div>
      <div class="confirm-dl-item">
        <dt>Año de publicación</dt>
        <dd>${ui.escapeHtml(item.anio_publicacion)}</dd>
      </div>
      <div class="confirm-dl-item">
        <dt>Autores</dt>
        <dd>${ui.escapeHtml(authorsText || 'Sin autores')}</dd>
      </div>
      <div class="confirm-dl-item">
        <dt>Inventario</dt>
        <dd>${ui.escapeHtml(item.copias_disponibles)} disponibles de ${ui.escapeHtml(item.cantidad_total)} ejemplares</dd>
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
      () => {
        store.deleteBook(isbn);
        ui.setFlash('warning', `Libro "${item.titulo}" eliminado del catálogo.`);
        window.location.href = '/libros.html';
      },
    );
  }
});
