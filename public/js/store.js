/* ==========================================================================
   BookVault REST API Store (store.js)
   Conecta todas las pantallas del frontend con los endpoints reales del
   backend (/api/*) usando window.BookVaultApi.apiFetch.
   ========================================================================== */

(function initBookVaultStore() {
  const { apiFetch, buildQueryString } = window.BookVaultApi;

  const Store = {
    /* ---------------- Panel Principal ---------------- */
    getStats() {
      return apiFetch('/stats');
    },

    /* ---------------- Categorías ---------------- */
    listCategories(query = '') {
      const qs = buildQueryString({ q: query });
      return apiFetch(`/categories${qs}`);
    },

    getCategory(id) {
      return apiFetch(`/categories/${encodeURIComponent(id)}`);
    },

    createCategory({ nombre, descripcion }) {
      return apiFetch('/categories', {
        method: 'POST',
        body: JSON.stringify({
          nombre: nombre.trim(),
          descripcion: descripcion.trim(),
        }),
      });
    },

    updateCategory(id, { nombre, descripcion }) {
      return apiFetch(`/categories/${encodeURIComponent(id)}`, {
        method: 'PUT',
        body: JSON.stringify({
          nombre: nombre.trim(),
          descripcion: descripcion.trim(),
        }),
      });
    },

    deleteCategory(id) {
      return apiFetch(`/categories/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
    },

    /* ---------------- Autores ---------------- */
    listAuthors(query = '') {
      const qs = buildQueryString({ q: query });
      return apiFetch(`/authors${qs}`);
    },

    getAuthor(id) {
      return apiFetch(`/authors/${encodeURIComponent(id)}`);
    },

    createAuthor({ nombre, nacionalidad }) {
      return apiFetch('/authors', {
        method: 'POST',
        body: JSON.stringify({
          nombre: nombre.trim(),
          nacionalidad: nacionalidad.trim(),
        }),
      });
    },

    updateAuthor(id, { nombre, nacionalidad }) {
      return apiFetch(`/authors/${encodeURIComponent(id)}`, {
        method: 'PUT',
        body: JSON.stringify({
          nombre: nombre.trim(),
          nacionalidad: nacionalidad.trim(),
        }),
      });
    },

    deleteAuthor(id) {
      return apiFetch(`/authors/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
    },

    /* ---------------- Libros ---------------- */
    listBooks(filters = {}) {
      const qs = buildQueryString({
        q: filters.q,
        category: filters.category,
        author: filters.author,
        available: filters.available ? 'true' : '',
      });
      return apiFetch(`/books${qs}`);
    },

    getBook(isbn) {
      return apiFetch(`/books/${encodeURIComponent(isbn)}`);
    },

    createBook({ isbn, cod_categoria, titulo, anio_publicacion, cantidad_total, autores }) {
      return apiFetch('/books', {
        method: 'POST',
        body: JSON.stringify({
          isbn: isbn.trim(),
          cod_categoria: Number(cod_categoria),
          titulo: titulo.trim(),
          anio_publicacion: Number(anio_publicacion),
          cantidad_total: Number(cantidad_total),
          autores: autores.map((a) => ({
            cod_autor: Number(a.cod_autor),
            rol: a.rol || 'PRINCIPAL',
          })),
        }),
      });
    },

    updateBook(isbn, { cod_categoria, titulo, anio_publicacion, cantidad_total, autores }) {
      return apiFetch(`/books/${encodeURIComponent(isbn)}`, {
        method: 'PUT',
        body: JSON.stringify({
          cod_categoria: Number(cod_categoria),
          titulo: titulo.trim(),
          anio_publicacion: Number(anio_publicacion),
          cantidad_total: Number(cantidad_total),
          autores: autores.map((a) => ({
            cod_autor: Number(a.cod_autor),
            rol: a.rol || 'PRINCIPAL',
          })),
        }),
      });
    },

    deleteBook(isbn) {
      return apiFetch(`/books/${encodeURIComponent(isbn)}`, {
        method: 'DELETE',
      });
    },

    /* ---------------- Clientes ---------------- */
    listClients(query = '') {
      const qs = buildQueryString({ q: query });
      return apiFetch(`/clients${qs}`);
    },

    getClient(cedula) {
      return apiFetch(`/clients/${encodeURIComponent(cedula)}`);
    },

    createClient({ cedula_cliente, nombre, correo, telefono, direccion }) {
      return apiFetch('/clients', {
        method: 'POST',
        body: JSON.stringify({
          cedula_cliente: cedula_cliente.trim(),
          nombre: nombre.trim(),
          correo: correo.trim().toLowerCase(),
          telefono: telefono.trim(),
          direccion: direccion.trim(),
        }),
      });
    },

    updateClient(cedula, { nombre, correo, telefono, direccion }) {
      return apiFetch(`/clients/${encodeURIComponent(cedula)}`, {
        method: 'PUT',
        body: JSON.stringify({
          nombre: nombre.trim(),
          correo: correo.trim().toLowerCase(),
          telefono: telefono.trim(),
          direccion: direccion.trim(),
        }),
      });
    },

    deleteClient(cedula) {
      return apiFetch(`/clients/${encodeURIComponent(cedula)}`, {
        method: 'DELETE',
      });
    },

    /* ---------------- Préstamos ---------------- */
    listLoans(filters = {}) {
      const status =
        filters.status && filters.status !== 'ALL' ? filters.status : '';
      const qs = buildQueryString({
        q: filters.q,
        status,
        cedula: filters.cedula,
        isbn: filters.isbn,
      });
      return apiFetch(`/loans${qs}`);
    },

    getLoan(id) {
      return apiFetch(`/loans/${encodeURIComponent(id)}`);
    },

    createLoan({ isbn, cedula_cliente, fecha_prestamo, fecha_limite }) {
      return apiFetch('/loans', {
        method: 'POST',
        body: JSON.stringify({
          isbn,
          cedula_cliente,
          fecha_prestamo,
          fecha_limite,
        }),
      });
    },

    returnLoan(id, fechaDevolucion) {
      return apiFetch(`/loans/${encodeURIComponent(id)}/return`, {
        method: 'PUT',
        body: JSON.stringify({
          fecha_devolucion: fechaDevolucion,
        }),
      });
    },
  };

  window.BookVaultStore = Store;
})();
