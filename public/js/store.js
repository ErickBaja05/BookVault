/* ==========================================================================
   BookVault Frontend Preview Store (store.js)
   Almacenamiento local en navegador (localStorage) para navegar, probar
   formularios, listados, edición, eliminación y devoluciones antes de
   conectar el backend REST (/api/*).
   ========================================================================== */

(function initBookVaultStore() {
  const STORAGE_KEY = 'bookvault_frontend_data_v1';

  const SEED_DATA = {
    nextIds: {
      category: 6,
      author: 7,
      loan: 6,
    },
    categories: [
      {
        cod_categoria: 1,
        nombre: 'Literatura Latinoamericana',
        descripcion: 'Novela, cuento y narrativa clásica y contemporánea de América Latina.',
      },
      {
        cod_categoria: 2,
        nombre: 'Ciencia Ficción',
        descripcion: 'Ficción especulativa, exploración espacial y futuros tecnológicos.',
      },
      {
        cod_categoria: 3,
        nombre: 'Historia y Sociedad',
        descripcion: 'Crónicas, ensayos históricos y memoria cultural.',
      },
      {
        cod_categoria: 4,
        nombre: 'Ingeniería y Tecnología',
        descripcion: 'Arquitectura de software, algoritmos y sistemas computacionales.',
      },
      {
        cod_categoria: 5,
        nombre: 'Filosofía y Ensayo',
        descripcion: 'Pensamiento crítico, ética y humanidades.',
      },
    ],
    authors: [
      { cod_autor: 1, nombre: 'Gabriel García Márquez', nacionalidad: 'Colombiana' },
      { cod_autor: 2, nombre: 'Isabel Allende', nacionalidad: 'Chilena' },
      { cod_autor: 3, nombre: 'Jorge Luis Borges', nacionalidad: 'Argentina' },
      { cod_autor: 4, nombre: 'Adolfo Bioy Casares', nacionalidad: 'Argentina' },
      { cod_autor: 5, nombre: 'Isaac Asimov', nacionalidad: 'Estadounidense' },
      { cod_autor: 6, nombre: 'Elena Poniatowska', nacionalidad: 'Mexicana' },
    ],
    books: [
      {
        isbn: '978-84-376-0494-7',
        cod_categoria: 1,
        titulo: 'Cien años de soledad',
        anio_publicacion: 1967,
        cantidad_total: 4,
        copias_disponibles: 3,
        autores: [{ cod_autor: 1, rol: 'PRINCIPAL' }],
      },
      {
        isbn: '978-84-206-3311-4',
        cod_categoria: 1,
        titulo: 'Seis problemas para don Isidro Parodi',
        anio_publicacion: 1942,
        cantidad_total: 2,
        copias_disponibles: 2,
        autores: [
          { cod_autor: 3, rol: 'PRINCIPAL' },
          { cod_autor: 4, rol: 'COAUTOR' },
        ],
      },
      {
        isbn: '978-84-9759-220-8',
        cod_categoria: 1,
        titulo: 'La casa de los espíritus',
        anio_publicacion: 1982,
        cantidad_total: 3,
        copias_disponibles: 2,
        autores: [{ cod_autor: 2, rol: 'PRINCIPAL' }],
      },
      {
        isbn: '978-84-9908-320-9',
        cod_categoria: 2,
        titulo: 'Fundación',
        anio_publicacion: 1951,
        cantidad_total: 1,
        copias_disponibles: 0,
        autores: [{ cod_autor: 5, rol: 'PRINCIPAL' }],
      },
      {
        isbn: '978-607-445-182-1',
        cod_categoria: 3,
        titulo: 'La noche de Tlatelolco',
        anio_publicacion: 1971,
        cantidad_total: 3,
        copias_disponibles: 3,
        autores: [{ cod_autor: 6, rol: 'PRINCIPAL' }],
      },
    ],
    clients: [
      {
        cedula_cliente: '1723456789',
        nombre: 'Camila Andrade Morales',
        correo: 'camila.andrade@correo.ec',
        telefono: '0991234567',
        direccion: 'Av. 6 de Diciembre y Colón, Quito',
      },
      {
        cedula_cliente: '0918273645',
        nombre: 'Mateo Villacís Paredes',
        correo: 'mateo.villacis@correo.ec',
        telefono: '0987654321',
        direccion: 'Calle Bolívar 412, Guayaquil',
      },
      {
        cedula_cliente: '1104567892',
        nombre: 'Valeria Salazar Cueva',
        correo: 'valeria.salazar@correo.ec',
        telefono: '0974561230',
        direccion: 'Barrio La Floresta, Quito',
      },
      {
        cedula_cliente: '1719876543',
        nombre: 'Diego Mendoza Torres',
        correo: 'diego.mendoza@correo.ec',
        telefono: '',
        direccion: '',
      },
    ],
    loans: [
      {
        cod_prestamo: 1,
        isbn: '978-84-376-0494-7',
        cedula_cliente: '1723456789',
        fecha_prestamo: '2026-11-18',
        fecha_limite: '2026-12-02',
        fecha_devolucion: null,
        estado: 'ACTIVE',
      },
      {
        cod_prestamo: 2,
        isbn: '978-84-9759-220-8',
        cedula_cliente: '0918273645',
        fecha_prestamo: '2026-11-20',
        fecha_limite: '2026-12-04',
        fecha_devolucion: null,
        estado: 'ACTIVE',
      },
      {
        cod_prestamo: 3,
        isbn: '978-84-9908-320-9',
        cedula_cliente: '1104567892',
        fecha_prestamo: '2026-11-22',
        fecha_limite: '2026-12-06',
        fecha_devolucion: null,
        estado: 'ACTIVE',
      },
      {
        cod_prestamo: 4,
        isbn: '978-84-206-3311-4',
        cedula_cliente: '1719876543',
        fecha_prestamo: '2026-11-01',
        fecha_limite: '2026-11-15',
        fecha_devolucion: '2026-11-12',
        estado: 'RETURNED',
      },
      {
        cod_prestamo: 5,
        isbn: '978-607-445-182-1',
        cedula_cliente: '1723456789',
        fecha_prestamo: '2026-10-25',
        fecha_limite: '2026-11-08',
        fecha_devolucion: '2026-11-06',
        estado: 'RETURNED',
      },
    ],
  };

  function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  function loadState() {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        const fresh = clone(SEED_DATA);
        saveState(fresh);
        return fresh;
      }
      return JSON.parse(raw);
    } catch {
      return clone(SEED_DATA);
    }
  }

  function saveState(state) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignorar si localStorage no está disponible
    }
  }

  const Store = {
    getStats() {
      const state = loadState();
      const totalCopies = state.books.reduce((acc, b) => acc + Number(b.cantidad_total || 0), 0);
      const availableCopies = state.books.reduce(
        (acc, b) => acc + Number(b.copias_disponibles || 0),
        0,
      );
      const activeLoans = state.loans.filter((l) => l.estado === 'ACTIVE').length;
      const returnedLoans = state.loans.filter((l) => l.estado === 'RETURNED').length;

      return {
        booksCount: state.books.length,
        totalCopies,
        availableCopies,
        activeLoans,
        returnedLoans,
        clientsCount: state.clients.length,
        categoriesCount: state.categories.length,
        authorsCount: state.authors.length,
      };
    },

    /* ---------------- Categorías ---------------- */
    listCategories(query = '') {
      const state = loadState();
      const q = String(query).trim().toLowerCase();
      return state.categories
        .filter((cat) => {
          if (!q) return true;
          return (
            cat.nombre.toLowerCase().includes(q) ||
            String(cat.descripcion || '').toLowerCase().includes(q) ||
            String(cat.cod_categoria).includes(q)
          );
        })
        .map((cat) => ({
          ...cat,
          libros_count: state.books.filter((b) => b.cod_categoria === cat.cod_categoria).length,
        }));
    },

    getCategory(id) {
      const state = loadState();
      const numericId = Number(id);
      const found = state.categories.find((c) => c.cod_categoria === numericId);
      if (!found) return null;
      return {
        ...found,
        libros_count: state.books.filter((b) => b.cod_categoria === numericId).length,
      };
    },

    createCategory({ nombre, descripcion }) {
      const state = loadState();
      const item = {
        cod_categoria: state.nextIds.category++,
        nombre: nombre.trim(),
        descripcion: descripcion.trim(),
      };
      state.categories.push(item);
      saveState(state);
      return item;
    },

    updateCategory(id, { nombre, descripcion }) {
      const state = loadState();
      const numericId = Number(id);
      const index = state.categories.findIndex((c) => c.cod_categoria === numericId);
      if (index === -1) return null;
      state.categories[index] = {
        ...state.categories[index],
        nombre: nombre.trim(),
        descripcion: descripcion.trim(),
      };
      saveState(state);
      return state.categories[index];
    },

    deleteCategory(id) {
      const state = loadState();
      const numericId = Number(id);
      state.categories = state.categories.filter((c) => c.cod_categoria !== numericId);
      saveState(state);
      return true;
    },

    /* ---------------- Autores ---------------- */
    listAuthors(query = '') {
      const state = loadState();
      const q = String(query).trim().toLowerCase();
      return state.authors
        .filter((author) => {
          if (!q) return true;
          return (
            author.nombre.toLowerCase().includes(q) ||
            String(author.nacionalidad || '').toLowerCase().includes(q) ||
            String(author.cod_autor).includes(q)
          );
        })
        .map((author) => ({
          ...author,
          libros_count: state.books.filter((b) =>
            (b.autores || []).some((a) => a.cod_autor === author.cod_autor),
          ).length,
        }));
    },

    getAuthor(id) {
      const state = loadState();
      const numericId = Number(id);
      const found = state.authors.find((a) => a.cod_autor === numericId);
      if (!found) return null;
      return {
        ...found,
        libros_count: state.books.filter((b) =>
          (b.autores || []).some((a) => a.cod_autor === numericId),
        ).length,
      };
    },

    createAuthor({ nombre, nacionalidad }) {
      const state = loadState();
      const item = {
        cod_autor: state.nextIds.author++,
        nombre: nombre.trim(),
        nacionalidad: nacionalidad.trim(),
      };
      state.authors.push(item);
      saveState(state);
      return item;
    },

    updateAuthor(id, { nombre, nacionalidad }) {
      const state = loadState();
      const numericId = Number(id);
      const index = state.authors.findIndex((a) => a.cod_autor === numericId);
      if (index === -1) return null;
      state.authors[index] = {
        ...state.authors[index],
        nombre: nombre.trim(),
        nacionalidad: nacionalidad.trim(),
      };
      saveState(state);
      return state.authors[index];
    },

    deleteAuthor(id) {
      const state = loadState();
      const numericId = Number(id);
      state.authors = state.authors.filter((a) => a.cod_autor !== numericId);
      saveState(state);
      return true;
    },

    /* ---------------- Libros ---------------- */
    listBooks(filters = {}) {
      const state = loadState();
      const q = String(filters.q || '').trim().toLowerCase();
      const categoryId = filters.category ? Number(filters.category) : null;
      const authorId = filters.author ? Number(filters.author) : null;
      const onlyAvailable = Boolean(filters.available);

      const categoryMap = new Map(state.categories.map((c) => [c.cod_categoria, c.nombre]));
      const authorMap = new Map(state.authors.map((a) => [a.cod_autor, a.nombre]));

      return state.books
        .filter((book) => {
          if (q) {
            const matchText =
              book.titulo.toLowerCase().includes(q) || book.isbn.toLowerCase().includes(q);
            if (!matchText) return false;
          }
          if (categoryId && book.cod_categoria !== categoryId) {
            return false;
          }
          if (authorId && !(book.autores || []).some((a) => a.cod_autor === authorId)) {
            return false;
          }
          if (onlyAvailable && Number(book.copias_disponibles) <= 0) {
            return false;
          }
          return true;
        })
        .map((book) => ({
          ...book,
          categoria_nombre: categoryMap.get(book.cod_categoria) || 'Sin categoría',
          autores_detalle: (book.autores || []).map((rel) => ({
            ...rel,
            nombre: authorMap.get(rel.cod_autor) || `Autor #${rel.cod_autor}`,
          })),
        }));
    },

    getBook(isbn) {
      const list = this.listBooks();
      return list.find((b) => b.isbn === isbn) || null;
    },

    createBook({ isbn, cod_categoria, titulo, anio_publicacion, cantidad_total, autores }) {
      const state = loadState();
      const total = Number(cantidad_total);
      const item = {
        isbn: isbn.trim(),
        cod_categoria: Number(cod_categoria),
        titulo: titulo.trim(),
        anio_publicacion: Number(anio_publicacion),
        cantidad_total: total,
        copias_disponibles: total,
        autores: autores.map((a) => ({
          cod_autor: Number(a.cod_autor),
          rol: a.rol || 'PRINCIPAL',
        })),
      };
      state.books.push(item);
      saveState(state);
      return item;
    },

    updateBook(isbn, { cod_categoria, titulo, anio_publicacion, cantidad_total, autores }) {
      const state = loadState();
      const index = state.books.findIndex((b) => b.isbn === isbn);
      if (index === -1) return null;

      const current = state.books[index];
      const activeBorrowed = Math.max(0, current.cantidad_total - current.copias_disponibles);
      const newTotal = Number(cantidad_total);
      const newAvailable = Math.max(0, newTotal - activeBorrowed);

      state.books[index] = {
        ...current,
        cod_categoria: Number(cod_categoria),
        titulo: titulo.trim(),
        anio_publicacion: Number(anio_publicacion),
        cantidad_total: newTotal,
        copias_disponibles: newAvailable,
        autores: autores.map((a) => ({
          cod_autor: Number(a.cod_autor),
          rol: a.rol || 'PRINCIPAL',
        })),
      };
      saveState(state);
      return state.books[index];
    },

    deleteBook(isbn) {
      const state = loadState();
      state.books = state.books.filter((b) => b.isbn !== isbn);
      saveState(state);
      return true;
    },

    /* ---------------- Clientes ---------------- */
    listClients(query = '') {
      const state = loadState();
      const q = String(query).trim().toLowerCase();
      return state.clients
        .filter((client) => {
          if (!q) return true;
          return (
            client.cedula_cliente.toLowerCase().includes(q) ||
            client.nombre.toLowerCase().includes(q) ||
            client.correo.toLowerCase().includes(q)
          );
        })
        .map((client) => ({
          ...client,
          prestamos_activos: state.loans.filter(
            (l) => l.cedula_cliente === client.cedula_cliente && l.estado === 'ACTIVE',
          ).length,
        }));
    },

    getClient(cedula) {
      const state = loadState();
      const found = state.clients.find((c) => c.cedula_cliente === cedula);
      if (!found) return null;
      return {
        ...found,
        prestamos_activos: state.loans.filter(
          (l) => l.cedula_cliente === cedula && l.estado === 'ACTIVE',
        ).length,
      };
    },

    createClient({ cedula_cliente, nombre, correo, telefono, direccion }) {
      const state = loadState();
      const item = {
        cedula_cliente: cedula_cliente.trim(),
        nombre: nombre.trim(),
        correo: correo.trim().toLowerCase(),
        telefono: telefono.trim(),
        direccion: direccion.trim(),
      };
      state.clients.push(item);
      saveState(state);
      return item;
    },

    updateClient(cedula, { nombre, correo, telefono, direccion }) {
      const state = loadState();
      const index = state.clients.findIndex((c) => c.cedula_cliente === cedula);
      if (index === -1) return null;
      state.clients[index] = {
        ...state.clients[index],
        nombre: nombre.trim(),
        correo: correo.trim().toLowerCase(),
        telefono: telefono.trim(),
        direccion: direccion.trim(),
      };
      saveState(state);
      return state.clients[index];
    },

    deleteClient(cedula) {
      const state = loadState();
      state.clients = state.clients.filter((c) => c.cedula_cliente !== cedula);
      saveState(state);
      return true;
    },

    /* ---------------- Préstamos ---------------- */
    listLoans(filters = {}) {
      const state = loadState();
      const q = String(filters.q || '').trim().toLowerCase();
      const status = String(filters.status || '').trim().toUpperCase();

      const bookMap = new Map(state.books.map((b) => [b.isbn, b]));
      const clientMap = new Map(state.clients.map((c) => [c.cedula_cliente, c]));

      return state.loans
        .map((loan) => {
          const book = bookMap.get(loan.isbn);
          const client = clientMap.get(loan.cedula_cliente);
          return {
            ...loan,
            libro_titulo: book ? book.titulo : 'Libro no encontrado',
            cliente_nombre: client ? client.nombre : 'Cliente no encontrado',
          };
        })
        .filter((loan) => {
          if (status && status !== 'ALL' && loan.estado !== status) {
            return false;
          }
          if (q) {
            const match =
              String(loan.cod_prestamo).includes(q) ||
              loan.isbn.toLowerCase().includes(q) ||
              loan.libro_titulo.toLowerCase().includes(q) ||
              loan.cedula_cliente.toLowerCase().includes(q) ||
              loan.cliente_nombre.toLowerCase().includes(q);
            if (!match) return false;
          }
          return true;
        })
        .sort((a, b) => b.cod_prestamo - a.cod_prestamo);
    },

    getLoan(id) {
      const numericId = Number(id);
      return this.listLoans().find((l) => l.cod_prestamo === numericId) || null;
    },

    createLoan({ isbn, cedula_cliente, fecha_prestamo, fecha_limite }) {
      const state = loadState();
      const item = {
        cod_prestamo: state.nextIds.loan++,
        isbn,
        cedula_cliente,
        fecha_prestamo,
        fecha_limite,
        fecha_devolucion: null,
        estado: 'ACTIVE',
      };
      state.loans.push(item);

      const book = state.books.find((b) => b.isbn === isbn);
      if (book && book.copias_disponibles > 0) {
        book.copias_disponibles -= 1;
      }

      saveState(state);
      return item;
    },

    returnLoan(id, fechaDevolucion) {
      const state = loadState();
      const numericId = Number(id);
      const loan = state.loans.find((l) => l.cod_prestamo === numericId);
      if (!loan) return null;

      loan.estado = 'RETURNED';
      loan.fecha_devolucion = fechaDevolucion;

      const book = state.books.find((b) => b.isbn === loan.isbn);
      if (book && book.copias_disponibles < book.cantidad_total) {
        book.copias_disponibles += 1;
      }

      saveState(state);
      return loan;
    },
  };

  window.BookVaultStore = Store;
})();
