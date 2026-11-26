CREATE TABLE IF NOT EXISTS categories (
  cod_categoria INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL UNIQUE,
  descripcion TEXT
);

CREATE TABLE IF NOT EXISTS authors (
  cod_autor INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  nacionalidad TEXT
);

CREATE TABLE IF NOT EXISTS books (
  isbn TEXT PRIMARY KEY,
  cod_categoria INTEGER NOT NULL,
  titulo TEXT NOT NULL,
  anio_publicacion INTEGER NOT NULL CHECK (anio_publicacion >= 1000),
  cantidad_total INTEGER NOT NULL CHECK (cantidad_total >= 1),
  copias_disponibles INTEGER NOT NULL CHECK (
    copias_disponibles >= 0 AND copias_disponibles <= cantidad_total
  ),
  FOREIGN KEY (cod_categoria) REFERENCES categories (cod_categoria) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS author_books (
  isbn TEXT NOT NULL,
  cod_autor INTEGER NOT NULL,
  rol TEXT NOT NULL DEFAULT 'PRINCIPAL' CHECK (rol IN ('PRINCIPAL', 'COAUTOR')),
  PRIMARY KEY (isbn, cod_autor),
  FOREIGN KEY (isbn) REFERENCES books (isbn) ON DELETE CASCADE,
  FOREIGN KEY (cod_autor) REFERENCES authors (cod_autor) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS clients (
  cedula_cliente TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  correo TEXT NOT NULL UNIQUE,
  telefono TEXT,
  direccion TEXT
);

CREATE TABLE IF NOT EXISTS loans (
  cod_prestamo INTEGER PRIMARY KEY AUTOINCREMENT,
  isbn TEXT NOT NULL,
  cedula_cliente TEXT NOT NULL,
  fecha_prestamo TEXT NOT NULL,
  fecha_limite TEXT NOT NULL,
  fecha_devolucion TEXT,
  estado TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (estado IN ('ACTIVE', 'RETURNED')),
  CHECK (fecha_limite >= fecha_prestamo),
  FOREIGN KEY (isbn) REFERENCES books (isbn) ON DELETE RESTRICT,
  FOREIGN KEY (cedula_cliente) REFERENCES clients (cedula_cliente) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_books_cod_categoria ON books (cod_categoria);
CREATE INDEX IF NOT EXISTS idx_books_titulo ON books (titulo);
CREATE INDEX IF NOT EXISTS idx_author_books_cod_autor ON author_books (cod_autor);
CREATE INDEX IF NOT EXISTS idx_loans_isbn ON loans (isbn);
CREATE INDEX IF NOT EXISTS idx_loans_cedula_cliente ON loans (cedula_cliente);
CREATE INDEX IF NOT EXISTS idx_loans_estado ON loans (estado);
