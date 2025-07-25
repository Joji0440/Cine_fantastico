-- ============================================
-- 🎬 SISTEMA DE GESTIÓN DE CINE - ESTRUCTURA MODERNIZADA
-- Basado en datos existentes con estructura más realista
-- ============================================

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- 🧹 LIMPIAR ESTRUCTURA EXISTENTE (SI EXISTE)
-- ============================================

-- Eliminar tablas si existen
DROP TABLE IF EXISTS auditoria_logs CASCADE;
DROP TABLE IF EXISTS configuraciones CASCADE;
DROP TABLE IF EXISTS promociones CASCADE;
DROP TABLE IF EXISTS reservas_asientos CASCADE;
DROP TABLE IF EXISTS reservas CASCADE;
DROP TABLE IF EXISTS funciones CASCADE;
DROP TABLE IF EXISTS peliculas_generos CASCADE;
DROP TABLE IF EXISTS peliculas CASCADE;
DROP TABLE IF EXISTS generos CASCADE;
DROP TABLE IF EXISTS paises CASCADE;
DROP TABLE IF EXISTS asientos CASCADE;
DROP TABLE IF EXISTS salas CASCADE;
DROP TABLE IF EXISTS empleados_detalles CASCADE;
DROP TABLE IF EXISTS usuarios CASCADE;

-- Eliminar vistas si existen
DROP VIEW IF EXISTS v_funciones_completas CASCADE;
DROP VIEW IF EXISTS v_reservas_detalladas CASCADE;

-- Eliminar funciones si existen
DROP FUNCTION IF EXISTS actualizar_timestamp() CASCADE;
DROP FUNCTION IF EXISTS generar_codigo_reserva() CASCADE;
DROP FUNCTION IF EXISTS log_auditoria() CASCADE;

-- Eliminar tipos ENUM si existen
DROP TYPE IF EXISTS tipo_usuario_enum CASCADE;
DROP TYPE IF EXISTS clasificacion_pelicula_enum CASCADE;
DROP TYPE IF EXISTS estado_reserva_enum CASCADE;
DROP TYPE IF EXISTS metodo_pago_enum CASCADE;
DROP TYPE IF EXISTS tipo_sala_enum CASCADE;
DROP TYPE IF EXISTS posicion_empleado_enum CASCADE;

-- ============================================
-- 📋 CREAR TIPOS ENUM MODERNOS
-- ============================================

CREATE TYPE tipo_usuario_enum AS ENUM ('cliente', 'empleado', 'administrador', 'gerente');
CREATE TYPE clasificacion_pelicula_enum AS ENUM ('G', 'PG', 'PG-13', 'R', 'NC-17'); -- Clasificación estándar internacional
CREATE TYPE estado_reserva_enum AS ENUM ('pendiente', 'confirmada', 'pagada', 'cancelada', 'usada', 'vencida');
CREATE TYPE metodo_pago_enum AS ENUM ('efectivo', 'tarjeta_credito', 'tarjeta_debito', 'transferencia', 'paypal');
CREATE TYPE tipo_sala_enum AS ENUM ('standard', 'premium', '3d', 'imax', 'vip');
CREATE TYPE posicion_empleado_enum AS ENUM ('cajero', 'acomodador', 'proyeccionista', 'limpieza', 'gerente', 'administrador');

-- ============================================
-- 👥 TABLA DE USUARIOS UNIFICADA (Clientes y Empleados)
-- ============================================

CREATE TABLE usuarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    telefono VARCHAR(20),
    fecha_nacimiento DATE,
    tipo_usuario tipo_usuario_enum NOT NULL DEFAULT 'cliente',
    email_verificado BOOLEAN DEFAULT false,
    activo BOOLEAN DEFAULT true,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT email_valido CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT telefono_valido CHECK (telefono IS NULL OR telefono ~* '^\+?[0-9\s\-\(\)]{10,15}$'),
    CONSTRAINT nombres_no_vacios CHECK (LENGTH(TRIM(nombre)) > 0 AND LENGTH(TRIM(apellido)) > 0)
);

-- Tabla para información adicional de empleados
CREATE TABLE empleados_detalles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    numero_empleado VARCHAR(20) UNIQUE NOT NULL,
    posicion posicion_empleado_enum NOT NULL DEFAULT 'cajero',
    salario DECIMAL(10,2),
    fecha_contratacion DATE NOT NULL DEFAULT CURRENT_DATE,
    supervisor_id UUID REFERENCES usuarios(id),
    turno VARCHAR(20) DEFAULT 'mañana', -- mañana, tarde, noche
    activo BOOLEAN DEFAULT true,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT salario_positivo CHECK (salario IS NULL OR salario > 0)
);

-- ============================================
-- 🎬 MÓDULO DE PELÍCULAS MEJORADO
-- ============================================

-- Géneros de películas
CREATE TABLE generos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(50) UNIQUE NOT NULL,
    descripcion TEXT,
    color_hex VARCHAR(7) DEFAULT '#6c757d',
    activo BOOLEAN DEFAULT true,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Países (para origen de películas)
CREATE TABLE paises (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo_iso VARCHAR(3) UNIQUE NOT NULL, -- USA, MEX, etc.
    nombre VARCHAR(100) UNIQUE NOT NULL,
    activo BOOLEAN DEFAULT true
);

-- Películas con información completa
CREATE TABLE peliculas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    titulo VARCHAR(200) NOT NULL,
    titulo_original VARCHAR(200),
    sinopsis TEXT,
    duracion_minutos INTEGER NOT NULL CHECK (duracion_minutos > 0),
    clasificacion clasificacion_pelicula_enum NOT NULL DEFAULT 'PG',
    director VARCHAR(150),
    reparto TEXT, -- Actores principales separados por comas
    pais_origen_id UUID REFERENCES paises(id),
    idioma_original VARCHAR(50) DEFAULT 'Español',
    subtitulos VARCHAR(200), -- Idiomas de subtítulos disponibles
    poster_url VARCHAR(500),
    trailer_url VARCHAR(500),
    calificacion_imdb DECIMAL(3,1) CHECK (calificacion_imdb >= 0 AND calificacion_imdb <= 10),
    fecha_estreno_mundial DATE,
    fecha_estreno_local DATE,
    presupuesto DECIMAL(12,2),
    recaudacion DECIMAL(15,2),
    activa BOOLEAN DEFAULT true,
    destacada BOOLEAN DEFAULT false,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fechas_estreno_logicas CHECK (
        fecha_estreno_local IS NULL OR 
        fecha_estreno_mundial IS NULL OR 
        fecha_estreno_local >= fecha_estreno_mundial
    )
);

-- Relación películas-géneros (muchos a muchos)
CREATE TABLE peliculas_generos (
    pelicula_id UUID REFERENCES peliculas(id) ON DELETE CASCADE,
    genero_id UUID REFERENCES generos(id) ON DELETE CASCADE,
    PRIMARY KEY (pelicula_id, genero_id)
);

-- ============================================
-- 🏢 MÓDULO DE SALAS Y ASIENTOS
-- ============================================

-- Salas de cine
CREATE TABLE salas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    numero INTEGER UNIQUE NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    tipo_sala tipo_sala_enum NOT NULL DEFAULT 'standard',
    capacidad_total INTEGER NOT NULL CHECK (capacidad_total > 0),
    filas INTEGER NOT NULL CHECK (filas > 0),
    asientos_por_fila INTEGER NOT NULL CHECK (asientos_por_fila > 0),
    precio_extra DECIMAL(6,2) DEFAULT 0.00 CHECK (precio_extra >= 0),
    activa BOOLEAN DEFAULT true,
    equipamiento JSONB DEFAULT '{}', -- Equipos especiales, sonido, etc.
    notas TEXT,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Configuración de asientos por sala
CREATE TABLE asientos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sala_id UUID NOT NULL REFERENCES salas(id) ON DELETE CASCADE,
    fila CHAR(1) NOT NULL, -- A, B, C, etc.
    numero INTEGER NOT NULL,
    codigo VARCHAR(5) GENERATED ALWAYS AS (fila || numero) STORED, -- A1, B5, etc.
    es_vip BOOLEAN DEFAULT false,
    habilitado BOOLEAN DEFAULT true, -- Para mantenimiento
    precio_extra DECIMAL(6,2) DEFAULT 0.00 CHECK (precio_extra >= 0),
    
    UNIQUE(sala_id, fila, numero),
    UNIQUE(sala_id, codigo)
);

-- ============================================
-- 🎫 MÓDULO DE FUNCIONES MEJORADO
-- ============================================

-- Funciones con más detalles
CREATE TABLE funciones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pelicula_id UUID NOT NULL REFERENCES peliculas(id) ON DELETE CASCADE,
    sala_id UUID NOT NULL REFERENCES salas(id) ON DELETE CASCADE,
    fecha_hora_inicio TIMESTAMP NOT NULL,
    fecha_hora_fin TIMESTAMP NOT NULL,
    precio_base DECIMAL(8,2) NOT NULL CHECK (precio_base > 0),
    precio_con_descuento DECIMAL(8,2),
    asientos_disponibles INTEGER NOT NULL DEFAULT 0,
    asientos_reservados INTEGER DEFAULT 0 CHECK (asientos_reservados >= 0),
    activa BOOLEAN DEFAULT true,
    especial BOOLEAN DEFAULT false, -- Función especial, estreno, etc.
    notas TEXT, -- Información adicional
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT horarios_validos CHECK (fecha_hora_fin > fecha_hora_inicio),
    CONSTRAINT precio_descuento_valido CHECK (
        precio_con_descuento IS NULL OR 
        precio_con_descuento <= precio_base
    ),
    CONSTRAINT asientos_coherentes CHECK (
        asientos_reservados <= (asientos_disponibles + asientos_reservados)
    )
);

-- ============================================
-- 🎟️ MÓDULO DE RESERVAS MEJORADO
-- ============================================

-- Reservas principales
CREATE TABLE reservas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo_reserva VARCHAR(15) UNIQUE NOT NULL,
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    funcion_id UUID NOT NULL REFERENCES funciones(id) ON DELETE CASCADE,
    cantidad_asientos INTEGER NOT NULL CHECK (cantidad_asientos > 0),
    precio_subtotal DECIMAL(10,2) NOT NULL CHECK (precio_subtotal >= 0),
    descuentos DECIMAL(10,2) DEFAULT 0.00 CHECK (descuentos >= 0),
    impuestos DECIMAL(10,2) DEFAULT 0.00 CHECK (impuestos >= 0),
    precio_total DECIMAL(10,2) NOT NULL CHECK (precio_total >= 0),
    estado estado_reserva_enum NOT NULL DEFAULT 'pendiente',
    metodo_pago metodo_pago_enum,
    fecha_reserva TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_vencimiento TIMESTAMP, -- Para reservas temporales
    fecha_pago TIMESTAMP,
    empleado_vendedor_id UUID REFERENCES usuarios(id),
    notas TEXT,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT precio_coherente CHECK (precio_total = precio_subtotal - descuentos + impuestos),
    CONSTRAINT fecha_vencimiento_futura CHECK (
        fecha_vencimiento IS NULL OR fecha_vencimiento > fecha_reserva
    )
);

-- Asientos específicos de cada reserva
CREATE TABLE reservas_asientos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reserva_id UUID NOT NULL REFERENCES reservas(id) ON DELETE CASCADE,
    asiento_id UUID NOT NULL REFERENCES asientos(id) ON DELETE CASCADE,
    precio_pagado DECIMAL(8,2) NOT NULL CHECK (precio_pagado >= 0),
    fecha_asignacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(reserva_id, asiento_id),
    -- Un asiento no puede estar reservado dos veces para la misma función
    UNIQUE(asiento_id, reserva_id)
);

-- ============================================
-- 📊 MÓDULO DE PROMOCIONES Y DESCUENTOS
-- ============================================

CREATE TABLE promociones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo VARCHAR(20) UNIQUE NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    tipo_descuento VARCHAR(20) NOT NULL CHECK (tipo_descuento IN ('porcentaje', 'monto_fijo')),
    valor_descuento DECIMAL(8,2) NOT NULL CHECK (valor_descuento > 0),
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    uso_maximo INTEGER DEFAULT 1, -- Cuántas veces se puede usar
    uso_actual INTEGER DEFAULT 0 CHECK (uso_actual >= 0),
    activa BOOLEAN DEFAULT true,
    aplica_dias_semana INTEGER[] DEFAULT '{1,2,3,4,5,6,7}', -- 1=Lunes, 7=Domingo
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fechas_promocion_validas CHECK (fecha_fin >= fecha_inicio),
    CONSTRAINT uso_coherente CHECK (uso_actual <= uso_maximo)
);

-- ============================================
-- 📝 MÓDULO DE AUDITORÍA UNIFICADO
-- ============================================

CREATE TABLE auditoria_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID REFERENCES usuarios(id),
    tabla_afectada VARCHAR(50) NOT NULL,
    accion VARCHAR(50) NOT NULL, -- INSERT, UPDATE, DELETE, LOGIN, LOGOUT, etc.
    registro_id VARCHAR(100), -- ID del registro afectado
    datos_anteriores JSONB,
    datos_nuevos JSONB,
    ip_address INET,
    user_agent TEXT,
    detalles TEXT,
    modulo VARCHAR(50), -- peliculas, reservas, usuarios, etc.
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear índices para la tabla de auditoría
CREATE INDEX idx_auditoria_usuario ON auditoria_logs (usuario_id);
CREATE INDEX idx_auditoria_tabla ON auditoria_logs (tabla_afectada);
CREATE INDEX idx_auditoria_fecha ON auditoria_logs (fecha_creacion);
CREATE INDEX idx_auditoria_accion ON auditoria_logs (accion);

-- ============================================
-- ⚙️ CONFIGURACIONES DEL SISTEMA
-- ============================================

CREATE TABLE configuraciones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clave VARCHAR(100) UNIQUE NOT NULL,
    valor TEXT NOT NULL,
    descripcion TEXT,
    categoria VARCHAR(50) DEFAULT 'general',
    tipo_dato VARCHAR(20) DEFAULT 'string', -- string, number, boolean, json
    es_publica BOOLEAN DEFAULT false,
    modificable BOOLEAN DEFAULT true,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 🔧 TRIGGERS Y FUNCIONES
-- ============================================

-- Función para actualizar timestamp automáticamente
CREATE OR REPLACE FUNCTION actualizar_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.fecha_actualizacion = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger a tablas con fecha_actualizacion
CREATE TRIGGER tr_usuarios_timestamp BEFORE UPDATE ON usuarios 
    FOR EACH ROW EXECUTE FUNCTION actualizar_timestamp();

CREATE TRIGGER tr_peliculas_timestamp BEFORE UPDATE ON peliculas 
    FOR EACH ROW EXECUTE FUNCTION actualizar_timestamp();

CREATE TRIGGER tr_funciones_timestamp BEFORE UPDATE ON funciones 
    FOR EACH ROW EXECUTE FUNCTION actualizar_timestamp();

CREATE TRIGGER tr_reservas_timestamp BEFORE UPDATE ON reservas 
    FOR EACH ROW EXECUTE FUNCTION actualizar_timestamp();

CREATE TRIGGER tr_salas_timestamp BEFORE UPDATE ON salas 
    FOR EACH ROW EXECUTE FUNCTION actualizar_timestamp();

-- Función para generar código de reserva único
CREATE OR REPLACE FUNCTION generar_codigo_reserva()
RETURNS TRIGGER AS $$
DECLARE
    nuevo_codigo VARCHAR(15);
    contador INTEGER := 0;
    timestamp_part TEXT;
    random_part TEXT;
    sequence_part TEXT;
BEGIN
    IF NEW.codigo_reserva IS NULL OR NEW.codigo_reserva = '' THEN
        LOOP
            -- Generar partes del código de manera más única
            timestamp_part := TO_CHAR(CURRENT_TIMESTAMP, 'YYYYMMDD');
            random_part := LPAD((floor(random() * 10000)::INTEGER)::TEXT, 4, '0');
            sequence_part := LPAD((EXTRACT(EPOCH FROM CURRENT_TIMESTAMP)::BIGINT % 1000000)::TEXT, 6, '0');
            
            -- Combinar para crear código único: CIN + fecha + últimos 6 dígitos del epoch + 4 dígitos random
            nuevo_codigo := 'CIN' || timestamp_part || RIGHT(sequence_part, 2) || random_part;
            
            -- Verificar si ya existe
            IF NOT EXISTS (SELECT 1 FROM reservas WHERE codigo_reserva = nuevo_codigo) THEN
                NEW.codigo_reserva = nuevo_codigo;
                EXIT;
            END IF;
            
            contador := contador + 1;
            -- Evitar loop infinito
            IF contador > 1000 THEN
                -- Como último recurso, usar UUID
                nuevo_codigo := 'CIN' || REPLACE(uuid_generate_v4()::TEXT, '-', '')::VARCHAR(12);
                NEW.codigo_reserva = nuevo_codigo;
                EXIT;
            END IF;
        END LOOP;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_generar_codigo_reserva BEFORE INSERT ON reservas
    FOR EACH ROW EXECUTE FUNCTION generar_codigo_reserva();

-- Función para log automático de auditoría
CREATE OR REPLACE FUNCTION log_auditoria()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        INSERT INTO auditoria_logs (tabla_afectada, accion, registro_id, datos_anteriores, modulo)
        VALUES (TG_TABLE_NAME, TG_OP, OLD.id::TEXT, row_to_json(OLD), 'sistema');
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO auditoria_logs (tabla_afectada, accion, registro_id, datos_anteriores, datos_nuevos, modulo)
        VALUES (TG_TABLE_NAME, TG_OP, NEW.id::TEXT, row_to_json(OLD), row_to_json(NEW), 'sistema');
        RETURN NEW;
    ELSIF TG_OP = 'INSERT' THEN
        INSERT INTO auditoria_logs (tabla_afectada, accion, registro_id, datos_nuevos, modulo)
        VALUES (TG_TABLE_NAME, TG_OP, NEW.id::TEXT, row_to_json(NEW), 'sistema');
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 📊 INSERTAR DATOS BASE Y MIGRAR DATOS EXISTENTES
-- ============================================

-- Insertar países
INSERT INTO paises (codigo_iso, nombre) VALUES 
('USA', 'Estados Unidos'),
('MEX', 'México'),
('ESP', 'España'),
('ARG', 'Argentina'),
('FRA', 'Francia'),
('GBR', 'Reino Unido'),
('JPN', 'Japón'),
('KOR', 'Corea del Sur');

-- Insertar géneros modernos
INSERT INTO generos (nombre, descripcion, color_hex) VALUES 
('Acción', 'Películas con secuencias de acción intensa', '#dc3545'),
('Aventura', 'Historias de exploración y descubrimiento', '#fd7e14'),
('Comedia', 'Películas divertidas y humorísticas', '#ffc107'),
('Drama', 'Narrativas emocionales profundas', '#6f42c1'),
('Terror', 'Películas de miedo y suspenso', '#212529'),
('Romance', 'Historias de amor y relaciones', '#e83e8c'),
('Ciencia Ficción', 'Futurismo y tecnología avanzada', '#17a2b8'),
('Fantasía', 'Mundos mágicos y sobrenaturales', '#28a745'),
('Animación', 'Películas animadas', '#fd7e14'),
('Documental', 'Contenido informativo real', '#6c757d'),
('Musical', 'Películas con canciones y coreografías', '#20c997'),
('Thriller', 'Suspenso y tensión psicológica', '#495057'),
('Crimen', 'Historias policiales y criminales', '#343a40'),
('Guerra', 'Conflictos bélicos', '#6c757d'),
('Biografía', 'Historias de vida real', '#17a2b8');

-- Crear salas realistas
INSERT INTO salas (numero, nombre, tipo_sala, capacidad_total, filas, asientos_por_fila, precio_extra) VALUES 
(1, 'Sala Principal', 'standard', 180, 15, 12, 0.00),
(2, 'Sala Premium', 'premium', 120, 10, 12, 25.00),
(3, 'Sala 3D', '3d', 150, 12, 13, 20.00),
(4, 'Sala VIP', 'vip', 60, 6, 10, 50.00),
(5, 'Sala IMAX', 'imax', 200, 16, 13, 75.00);

-- Generar asientos para cada sala
DO $$
DECLARE
    sala_record RECORD;
    fila_char CHAR;
    asiento_num INTEGER;
    fila_numero INTEGER;
BEGIN
    FOR sala_record IN SELECT id, filas, asientos_por_fila FROM salas LOOP
        FOR fila_numero IN 1..sala_record.filas LOOP
            fila_char := CHR(64 + fila_numero); -- A=65, B=66, etc.
            FOR asiento_num IN 1..sala_record.asientos_por_fila LOOP
                INSERT INTO asientos (sala_id, fila, numero, es_vip, precio_extra)
                VALUES (
                    sala_record.id,
                    fila_char,
                    asiento_num,
                    fila_numero <= 3, -- Primeras 3 filas son VIP
                    CASE WHEN fila_numero <= 3 THEN 15.00 ELSE 0.00 END
                );
            END LOOP;
        END LOOP;
    END LOOP;
END $$;

-- ============================================
-- 🎬 DATOS DE EJEMPLO PARA NUEVA BASE DE DATOS
-- ============================================

-- Crear usuarios de ejemplo (clientes y empleados)
INSERT INTO usuarios (email, password_hash, nombre, apellido, telefono, tipo_usuario, activo) VALUES 
-- Clientes
('juan@gmail.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Juan', 'Pérez', '0987654321', 'cliente', true),
('maria.garcia@email.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'María', 'García', '0987654322', 'cliente', true),
('carlos.lopez@email.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Carlos', 'López', '0987654323', 'cliente', true),
-- Empleados
('gerente@cinemax.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Ana', 'Martínez', '0987654324', 'gerente', true),
('empleado1@cinemax.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Luis', 'Rodríguez', '0987654325', 'empleado', true),
('empleado2@cinemax.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Sofia', 'Hernández', '0987654326', 'empleado', true);

-- Crear detalles de empleados
INSERT INTO empleados_detalles (usuario_id, numero_empleado, posicion, salario, fecha_contratacion)
SELECT 
    u.id,
    'EMP' || LPAD(ROW_NUMBER() OVER()::TEXT, 3, '0'),
    CASE 
        WHEN u.tipo_usuario = 'administrador' THEN 'administrador'::posicion_empleado_enum
        WHEN u.tipo_usuario = 'gerente' THEN 'gerente'::posicion_empleado_enum
        ELSE 'cajero'::posicion_empleado_enum
    END,
    CASE 
        WHEN u.tipo_usuario = 'administrador' THEN 25000.00
        WHEN u.tipo_usuario = 'gerente' THEN 20000.00
        ELSE 12000.00
    END,
    CURRENT_DATE - INTERVAL '6 months'
FROM usuarios u 
WHERE u.tipo_usuario IN ('empleado', 'administrador', 'gerente');

-- Insertar películas populares de ejemplo
DO $$
DECLARE
    peli_record RECORD;
    pais_mexico_id UUID;
    pais_usa_id UUID;
    genero_id UUID;
    pelicula_id UUID;
BEGIN
    -- Obtener IDs de países
    SELECT id INTO pais_mexico_id FROM paises WHERE codigo_iso = 'MEX';
    SELECT id INTO pais_usa_id FROM paises WHERE codigo_iso = 'USA';
    
    -- Insertar películas populares
    FOR peli_record IN 
        SELECT * FROM (VALUES 
            ('Avatar: El Camino del Agua', 'Aventura', 'PG-13', 192, 'Continuación de la saga Avatar donde Jake y Neytiri forman una familia y hacen todo lo posible por mantenerse juntos.', pais_usa_id),
            ('Top Gun: Maverick', 'Acción', 'PG-13', 130, 'Después de más de 30 años de servicio como uno de los mejores aviadores de la Marina, Pete "Maverick" Mitchell está donde pertenece.', pais_usa_id),
            ('Spider-Man: No Way Home', 'Acción', 'PG-13', 148, 'Peter Parker busca la ayuda del Doctor Strange para hacer que el mundo olvide que él es Spider-Man.', pais_usa_id),
            ('Los Minions: Nace un Villano', 'Animación', 'G', 87, 'La historia no contada de un niño fan de los súpervillanos que se conoce como Gru.', pais_usa_id),
            ('Doctor Strange 2', 'Fantasía', 'PG-13', 126, 'El Dr. Strange viaja al multiverso para enfrentar una nueva amenaza misteriosa.', pais_usa_id),
            ('Jurassic World: Dominion', 'Aventura', 'PG-13', 147, 'Cuatro años después de la destrucción de Isla Nublar, los dinosaurios viven ahora junto a los humanos.', pais_usa_id),
            ('Thor: Amor y Trueno', 'Acción', 'PG-13', 119, 'Thor emprende un viaje diferente a todo lo que ha enfrentado: una búsqueda de la paz interior.', pais_usa_id),
            ('Black Panther: Wakanda Forever', 'Acción', 'PG-13', 161, 'Wakanda lucha por proteger su nación de las potencias mundiales que intervienen.', pais_usa_id),
            ('Lightyear', 'Animación', 'G', 105, 'La historia definitiva del origen de Buzz Lightyear, el héroe que inspiró el juguete.', pais_usa_id),
            ('Sonic 2: La Película', 'Aventura', 'G', 122, 'Sonic y Tails se unen para detener al Dr. Robotnik y a Knuckles en su plan de encontrar la Esmeralda Maestra.', pais_usa_id)
        ) AS t(titulo, genero_nombre, clasificacion, duracion, sinopsis, pais_id)
    LOOP
        -- Obtener el género
        SELECT id INTO genero_id FROM generos WHERE nombre = peli_record.genero_nombre;
        
        -- Insertar película
        INSERT INTO peliculas (
            titulo, sinopsis, duracion_minutos, 
            clasificacion, pais_origen_id, activa, destacada,
            fecha_estreno_local, director, idioma_original
        ) VALUES (
            peli_record.titulo,
            peli_record.sinopsis,
            peli_record.duracion,
            peli_record.clasificacion::clasificacion_pelicula_enum,
            peli_record.pais_id,
            true,
            (random() > 0.7), -- 30% de probabilidad de ser destacada
            CURRENT_DATE - (random() * 60)::INTEGER,
            'Director ' || SUBSTRING(peli_record.titulo, 1, 10),
            CASE WHEN peli_record.pais_id = pais_mexico_id THEN 'Español' ELSE 'Inglés' END
        ) RETURNING id INTO pelicula_id;
        
        -- Asociar género
        IF genero_id IS NOT NULL THEN
            INSERT INTO peliculas_generos (pelicula_id, genero_id) 
            VALUES (pelicula_id, genero_id);
        END IF;
        
    END LOOP;
END $$;

-- Crear funciones de ejemplo para las próximas 2 semanas
DO $$
DECLARE
    pelicula_record RECORD;
    sala_record RECORD;
    fecha_actual DATE := CURRENT_DATE;
    hora_inicio TIME;
    contador INTEGER := 0;
BEGIN
    -- Crear funciones para cada película en diferentes horarios
    FOR pelicula_record IN SELECT id, titulo, duracion_minutos FROM peliculas ORDER BY fecha_creacion LOOP
        FOR sala_record IN SELECT id, numero FROM salas LOOP
            -- Crear funciones para los próximos 7 días
            FOR dia_offset IN 0..6 LOOP
                -- 3 funciones por día: matinée, tarde, noche
                FOR horario IN 1..3 LOOP
                    hora_inicio := CASE horario
                        WHEN 1 THEN '14:00'::TIME
                        WHEN 2 THEN '17:30'::TIME
                        ELSE '21:00'::TIME
                    END;
                    
                    INSERT INTO funciones (
                        pelicula_id, sala_id, 
                        fecha_hora_inicio, fecha_hora_fin,
                        precio_base, precio_con_descuento,
                        asientos_disponibles
                    ) VALUES (
                        pelicula_record.id,
                        sala_record.id,
                        (fecha_actual + dia_offset) + hora_inicio,
                        (fecha_actual + dia_offset) + hora_inicio + (pelicula_record.duracion_minutos || ' minutes')::INTERVAL,
                        120.00 + (random() * 50)::NUMERIC(8,2), -- Precio entre 120-170
                        CASE WHEN random() > 0.7 THEN 100.00 ELSE NULL END, -- 30% tienen descuento
                        (SELECT capacidad_total FROM salas WHERE id = sala_record.id)
                    );
                    
                    contador := contador + 1;
                    -- Solo crear unas pocas funciones para no saturar
                    EXIT WHEN contador >= 50;
                END LOOP;
                EXIT WHEN contador >= 50;
            END LOOP;
            EXIT WHEN contador >= 50;
        END LOOP;
        EXIT WHEN contador >= 50;
    END LOOP;
END $$;

-- ============================================
-- 📊 SISTEMA LISTO PARA RESERVAS NUEVAS
-- ============================================
-- Las reservas se crearán dinámicamente a través de la aplicación
-- La función generar_codigo_reserva() está activa y funcionando

-- Crear algunas promociones activas
INSERT INTO promociones (codigo, nombre, descripcion, tipo_descuento, valor_descuento, fecha_inicio, fecha_fin) VALUES 
('ESTUDIANTE', 'Descuento Estudiantes', 'Descuento especial para estudiantes con credencial', 'porcentaje', 20.00, CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE + INTERVAL '90 days'),
('LUNES50', 'Lunes de Descuento', 'Todos los lunes 50% de descuento', 'porcentaje', 50.00, CURRENT_DATE - INTERVAL '7 days', CURRENT_DATE + INTERVAL '30 days'),
('FAMILIA', 'Precio Familiar', 'Descuento $30 en compras familiares', 'monto_fijo', 30.00, CURRENT_DATE, CURRENT_DATE + INTERVAL '60 days'),
('PAREJA', 'Promoción Pareja', '2x1 los miércoles para parejas', 'porcentaje', 50.00, CURRENT_DATE, CURRENT_DATE + INTERVAL '45 days');

-- Usuario administrador
INSERT INTO usuarios (email, password_hash, nombre, apellido, tipo_usuario)
VALUES (
    'admin@cinemax.com',
    '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- password
    'Administrador',
    'Sistema',
    'administrador'
);

-- Configuraciones iniciales
INSERT INTO configuraciones (clave, valor, descripcion, categoria, tipo_dato, es_publica) VALUES 
('nombre_cine', 'CineMax Premium', 'Nombre del cine', 'general', 'string', true),
('direccion', 'Av. Principal 123, Ciudad Centro', 'Dirección principal', 'contacto', 'string', true),
('telefono_principal', '+52 55 1234 5678', 'Teléfono principal', 'contacto', 'string', true),
('email_contacto', 'contacto@cinemax.com', 'Email de contacto', 'contacto', 'string', true),
('horario_apertura', '10:00', 'Hora de apertura', 'operacion', 'string', true),
('horario_cierre', '23:30', 'Hora de cierre', 'operacion', 'string', true),
('precio_base_estandar', '120.00', 'Precio base función estándar (MXN)', 'precios', 'number', false),
('descuento_estudiante', '20', 'Descuento estudiantes (%)', 'promociones', 'number', true),
('descuento_adulto_mayor', '25', 'Descuento adultos mayores (%)', 'promociones', 'number', true),
('tiempo_reserva_temporal', '15', 'Minutos para confirmar reserva', 'reservas', 'number', false),
('iva_porcentaje', '16', 'Porcentaje de IVA (%)', 'precios', 'number', false),
('moneda', 'MXN', 'Moneda local', 'general', 'string', true);

-- ============================================
-- 📊 VISTAS ÚTILES PARA REPORTES
-- ============================================

-- Vista de funciones con información completa
CREATE VIEW v_funciones_completas AS
SELECT 
    f.id,
    f.fecha_hora_inicio,
    f.fecha_hora_fin,
    f.precio_base,
    f.asientos_disponibles,
    f.asientos_reservados,
    p.titulo as pelicula,
    p.duracion_minutos,
    p.clasificacion,
    s.numero as sala_numero,
    s.nombre as sala_nombre,
    s.tipo_sala,
    f.activa
FROM funciones f
JOIN peliculas p ON f.pelicula_id = p.id
JOIN salas s ON f.sala_id = s.id;

-- Vista de reservas con información del cliente
CREATE VIEW v_reservas_detalladas AS
SELECT 
    r.id,
    r.codigo_reserva,
    r.cantidad_asientos,
    r.precio_total,
    r.estado,
    r.fecha_reserva,
    u.nombre || ' ' || u.apellido as cliente_nombre,
    u.email as cliente_email,
    p.titulo as pelicula,
    f.fecha_hora_inicio,
    s.nombre as sala
FROM reservas r
JOIN usuarios u ON r.usuario_id = u.id
JOIN funciones f ON r.funcion_id = f.id
JOIN peliculas p ON f.pelicula_id = p.id
JOIN salas s ON f.sala_id = s.id;

-- ============================================
-- 🎯 CONFIRMACIÓN DE CREACIÓN EXITOSA
-- ============================================

DO $$
DECLARE
    total_usuarios INTEGER;
    total_empleados INTEGER;
    total_peliculas INTEGER;
    total_funciones INTEGER;
    total_salas INTEGER;
    total_asientos INTEGER;
    total_reservas INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_usuarios FROM usuarios;
    SELECT COUNT(*) INTO total_empleados FROM empleados_detalles;
    SELECT COUNT(*) INTO total_peliculas FROM peliculas;
    SELECT COUNT(*) INTO total_funciones FROM funciones;
    SELECT COUNT(*) INTO total_salas FROM salas;
    SELECT COUNT(*) INTO total_asientos FROM asientos;
    SELECT COUNT(*) INTO total_reservas FROM reservas;
    
    RAISE NOTICE '╔══════════════════════════════════════════╗';
    RAISE NOTICE '║      🎬 CINEMAX DATABASE CREADA           ║';
    RAISE NOTICE '╠══════════════════════════════════════════╣';
    RAISE NOTICE '║ 👥 Usuarios totales: %                   ║', LPAD(total_usuarios::TEXT, 15);
    RAISE NOTICE '║ 👔 Empleados: %                          ║', LPAD(total_empleados::TEXT, 20);
    RAISE NOTICE '║ 🎬 Películas: %                          ║', LPAD(total_peliculas::TEXT, 20);
    RAISE NOTICE '║ 🎫 Funciones: %                          ║', LPAD(total_funciones::TEXT, 20);
    RAISE NOTICE '║ 🏢 Salas: %                              ║', LPAD(total_salas::TEXT, 24);
    RAISE NOTICE '║ 💺 Asientos: %                           ║', LPAD(total_asientos::TEXT, 19);
    RAISE NOTICE '║ 🎟️ Reservas: %                           ║', LPAD(total_reservas::TEXT, 19);
    RAISE NOTICE '╠══════════════════════════════════════════╣';
    RAISE NOTICE '║   ✅ BASE DE DATOS LISTA PARA USAR        ║';
    RAISE NOTICE '║   🔐 Admin: admin@cinemax.com             ║';
    RAISE NOTICE '║   🔑 Password: password                   ║';
    RAISE NOTICE '║   📊 Sistema moderno y escalable         ║';
    RAISE NOTICE '╚══════════════════════════════════════════╝';
END $$;
