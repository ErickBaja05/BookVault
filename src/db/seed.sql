-- Datos iniciales idempotentes para pruebas de desarrollo en BookVault
-- Cumplen integridad referencial y consistencia de inventario (RN-01 a RN-09)

INSERT OR IGNORE INTO categories (cod_categoria, nombre, descripcion) VALUES
  (1, 'Literatura Latinoamericana', 'Novela, cuento y narrativa clásica y contemporánea de América Latina.'),
  (2, 'Ciencia Ficción', 'Ficción especulativa, exploración espacial y futuros tecnológicos.'),
  (3, 'Historia y Sociedad', 'Crónicas, ensayos históricos y memoria cultural.'),
  (4, 'Ingeniería y Tecnología', 'Arquitectura de software, algoritmos y sistemas computacionales.'),
  (5, 'Filosofía y Ensayo', 'Pensamiento crítico, ética y humanidades.');

INSERT OR IGNORE INTO authors (cod_autor, nombre, nacionalidad) VALUES
  (1, 'Gabriel García Márquez', 'Colombiana'),
  (2, 'Isabel Allende', 'Chilena'),
  (3, 'Jorge Luis Borges', 'Argentina'),
  (4, 'Adolfo Bioy Casares', 'Argentina'),
  (5, 'Isaac Asimov', 'Estadounidense'),
  (6, 'Elena Poniatowska', 'Mexicana');

INSERT OR IGNORE INTO books (
  isbn,
  cod_categoria,
  titulo,
  anio_publicacion,
  cantidad_total,
  copias_disponibles
) VALUES
  ('978-84-376-0494-7', 1, 'Cien años de soledad', 1967, 4, 3),
  ('978-84-206-3311-4', 1, 'Seis problemas para don Isidro Parodi', 1942, 2, 2),
  ('978-84-9759-220-8', 1, 'La casa de los espíritus', 1982, 3, 2),
  ('978-84-9908-320-9', 2, 'Fundación', 1951, 1, 0),
  ('978-607-445-182-1', 3, 'La noche de Tlatelolco', 1971, 3, 3);

INSERT OR IGNORE INTO author_books (isbn, cod_autor, rol) VALUES
  ('978-84-376-0494-7', 1, 'PRINCIPAL'),
  ('978-84-206-3311-4', 3, 'PRINCIPAL'),
  ('978-84-206-3311-4', 4, 'COAUTOR'),
  ('978-84-9759-220-8', 2, 'PRINCIPAL'),
  ('978-84-9908-320-9', 5, 'PRINCIPAL'),
  ('978-607-445-182-1', 6, 'PRINCIPAL');

INSERT OR IGNORE INTO clients (
  cedula_cliente,
  nombre,
  correo,
  telefono,
  direccion
) VALUES
  ('1723456789', 'Camila Andrade Morales', 'camila.andrade@correo.ec', '0991234567', 'Av. 6 de Diciembre y Colón, Quito'),
  ('0918273645', 'Mateo Villacís Paredes', 'mateo.villacis@correo.ec', '0987654321', 'Calle Bolívar 412, Guayaquil'),
  ('1104567892', 'Valeria Salazar Cueva', 'valeria.salazar@correo.ec', '0974561230', 'Barrio La Floresta, Quito'),
  ('1719876543', 'Diego Mendoza Torres', 'diego.mendoza@correo.ec', NULL, NULL);

INSERT OR IGNORE INTO loans (
  cod_prestamo,
  isbn,
  cedula_cliente,
  fecha_prestamo,
  fecha_limite,
  fecha_devolucion,
  estado
) VALUES
  (1, '978-84-376-0494-7', '1723456789', '2026-11-18', '2026-12-02', NULL, 'ACTIVE'),
  (2, '978-84-9759-220-8', '0918273645', '2026-11-20', '2026-12-04', NULL, 'ACTIVE'),
  (3, '978-84-9908-320-9', '1104567892', '2026-11-22', '2026-12-06', NULL, 'ACTIVE'),
  (4, '978-84-206-3311-4', '1719876543', '2026-11-01', '2026-11-15', '2026-11-12', 'RETURNED'),
  (5, '978-607-445-182-1', '1723456789', '2026-10-25', '2026-11-08', '2026-11-06', 'RETURNED');
