-- =====================================================================
--  SISTEMA DE TICKETING - MUNDIAL 2026
--  FASE 3 - MODELO FISICO POSTGRESQL - DDL (estructura)
--  Bases de Datos II - UCU
--
--  Convenciones:
--    * snake_case en minusculas
--    * Claves subrogadas BIGSERIAL/SERIAL (id_*)
--    * Claves naturales protegidas con UNIQUE
--    * Integridad referencial explicita con nombres de constraint
--    * Dominios y CHECK para estados y valores acotados
--  Orden de ejecucion: 01_ddl -> 02_triggers -> 03_procedures -> 04_queries
-- =====================================================================

-- Recomendado para comparacion de mails case-insensitive
CREATE EXTENSION IF NOT EXISTS citext;
-- Necesaria para EXCLUDE con rangos (anti-superposicion de eventos)
CREATE EXTENSION IF NOT EXISTS btree_gist;
-- UUID para el codigo unico de la entrada
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------------------------------------------------------------------
-- DOMINIOS (tipos de estado controlados a nivel de BD)
-- ---------------------------------------------------------------------
DROP DOMAIN IF EXISTS dom_estado_venta CASCADE;
CREATE DOMAIN dom_estado_venta AS VARCHAR(12)
    CHECK (VALUE IN ('PENDIENTE','CONFIRMADA','PAGA','ANULADA'));

DROP DOMAIN IF EXISTS dom_estado_entrada CASCADE;
CREATE DOMAIN dom_estado_entrada AS VARCHAR(12)
    CHECK (VALUE IN ('EMITIDA','TRANSFERIDA','CONSUMIDA','ANULADA'));

DROP DOMAIN IF EXISTS dom_estado_transf CASCADE;
CREATE DOMAIN dom_estado_transf AS VARCHAR(12)
    CHECK (VALUE IN ('PENDIENTE','ACEPTADA','RECHAZADA','CANCELADA'));

DROP DOMAIN IF EXISTS dom_resultado_val CASCADE;
CREATE DOMAIN dom_resultado_val AS VARCHAR(10)
    CHECK (VALUE IN ('ACEPTADO','RECHAZADO'));

-- =====================================================================
-- 1. CATALOGOS GEOGRAFICOS
-- =====================================================================

CREATE TABLE pais (
    id_pais     SERIAL       NOT NULL,
    codigo_iso  CHAR(3)      NOT NULL,
    nombre      VARCHAR(80)  NOT NULL,
    CONSTRAINT pk_pais            PRIMARY KEY (id_pais),
    CONSTRAINT uq_pais_iso        UNIQUE (codigo_iso),
    CONSTRAINT uq_pais_nombre     UNIQUE (nombre)
);

-- Especializacion: paises que ademas son SEDE del mundial
CREATE TABLE pais_sede (
    id_pais         INT     NOT NULL,
    fecha_alta_sede DATE    NOT NULL DEFAULT CURRENT_DATE,
    CONSTRAINT pk_pais_sede  PRIMARY KEY (id_pais),
    CONSTRAINT fk_pais_sede_pais FOREIGN KEY (id_pais)
        REFERENCES pais (id_pais) ON UPDATE CASCADE ON DELETE RESTRICT
);

-- =====================================================================
-- 2. MODULO DE USUARIOS
-- =====================================================================

CREATE TABLE direccion (
    id_direccion  BIGSERIAL    NOT NULL,
    id_pais       INT          NOT NULL,
    localidad     VARCHAR(80)  NOT NULL,
    calle         VARCHAR(120) NOT NULL,
    numero        VARCHAR(15)  NOT NULL,
    codigo_postal VARCHAR(15)  NOT NULL,
    CONSTRAINT pk_direccion      PRIMARY KEY (id_direccion),
    CONSTRAINT fk_direccion_pais FOREIGN KEY (id_pais)
        REFERENCES pais (id_pais) ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE TABLE usuario (
    id_usuario    BIGSERIAL   NOT NULL,
    email         CITEXT      NOT NULL,           -- identifica al usuario
    nombre        VARCHAR(80) NOT NULL,
    apellido      VARCHAR(80) NOT NULL,
    id_direccion  BIGINT      NOT NULL,
    fecha_alta    TIMESTAMPTZ NOT NULL DEFAULT now(),
    password_hash VARCHAR(72) NOT NULL,           -- bcrypt (60 chars reales, 72 por seguridad)
    CONSTRAINT pk_usuario        PRIMARY KEY (id_usuario),
    CONSTRAINT uq_usuario_email  UNIQUE (email),
    CONSTRAINT uq_usuario_dir    UNIQUE (id_direccion),   -- 1:1 con direccion
    CONSTRAINT fk_usuario_dir    FOREIGN KEY (id_direccion)
        REFERENCES direccion (id_direccion) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT ck_usuario_email  CHECK (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$')
);

-- Documento 1:1 con usuario, clave natural compuesta (pais+tipo+numero)
CREATE TABLE documento (
    id_documento BIGSERIAL   NOT NULL,
    id_usuario   BIGINT      NOT NULL,
    id_pais      INT         NOT NULL,
    tipo_documento VARCHAR(10) NOT NULL,
    numero       VARCHAR(30)  NOT NULL,
    CONSTRAINT pk_documento       PRIMARY KEY (id_documento),
    CONSTRAINT uq_documento_user  UNIQUE (id_usuario),                 -- 1:1
    CONSTRAINT uq_documento_nat   UNIQUE (id_pais, tipo_documento, numero),
    CONSTRAINT fk_documento_user  FOREIGN KEY (id_usuario)
        REFERENCES usuario (id_usuario) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_documento_pais  FOREIGN KEY (id_pais)
        REFERENCES pais (id_pais) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT ck_documento_tipo  CHECK (tipo_documento IN ('CI','PASAPORTE','DNI','RUT','OTRO'))
);

-- Telefono multivaluado (1:N)
CREATE TABLE telefono (
    id_telefono BIGSERIAL   NOT NULL,
    id_usuario  BIGINT      NOT NULL,
    numero      VARCHAR(25) NOT NULL,
    tipo        VARCHAR(15) NOT NULL DEFAULT 'MOVIL',
    CONSTRAINT pk_telefono       PRIMARY KEY (id_telefono),
    CONSTRAINT uq_telefono       UNIQUE (id_usuario, numero),
    CONSTRAINT fk_telefono_user  FOREIGN KEY (id_usuario)
        REFERENCES usuario (id_usuario) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT ck_telefono_tipo  CHECK (tipo IN ('MOVIL','FIJO','TRABAJO','OTRO'))
);

-- ----- Especializacion de USUARIO (disjunta, cada subtipo comparte la PK) -----

CREATE TABLE usuario_general (
    id_usuario           BIGINT  NOT NULL,
    fecha_registro       TIMESTAMPTZ NOT NULL DEFAULT now(),
    identidad_verificada BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT pk_usuario_general PRIMARY KEY (id_usuario),
    CONSTRAINT fk_usuario_general FOREIGN KEY (id_usuario)
        REFERENCES usuario (id_usuario) ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE administrador_pais (
    id_usuario      BIGINT NOT NULL,
    fecha_asignacion DATE  NOT NULL DEFAULT CURRENT_DATE,
    id_pais         INT    NOT NULL,            -- jurisdiccion (pais sede)
    CONSTRAINT pk_admin_pais  PRIMARY KEY (id_usuario),
    CONSTRAINT fk_admin_user  FOREIGN KEY (id_usuario)
        REFERENCES usuario (id_usuario) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_admin_sede  FOREIGN KEY (id_pais)
        REFERENCES pais_sede (id_pais) ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE TABLE funcionario_validacion (
    id_usuario     BIGINT      NOT NULL,
    numero_legajo  VARCHAR(20) NOT NULL,
    CONSTRAINT pk_funcionario       PRIMARY KEY (id_usuario),
    CONSTRAINT uq_funcionario_legajo UNIQUE (numero_legajo),
    CONSTRAINT fk_funcionario_user  FOREIGN KEY (id_usuario)
        REFERENCES usuario (id_usuario) ON UPDATE CASCADE ON DELETE CASCADE
);

-- Dispositivos de escaneo: OBLIGATORIAMENTE vinculados a un funcionario
CREATE TABLE dispositivo (
    id_dispositivo      BIGSERIAL   NOT NULL,
    identificador_fisico VARCHAR(60) NOT NULL,
    estado              VARCHAR(12) NOT NULL DEFAULT 'ACTIVO',
    fecha_registro      TIMESTAMPTZ NOT NULL DEFAULT now(),
    id_funcionario      BIGINT      NOT NULL,
    CONSTRAINT pk_dispositivo        PRIMARY KEY (id_dispositivo),
    CONSTRAINT uq_dispositivo_fisico UNIQUE (identificador_fisico),
    CONSTRAINT fk_dispositivo_func   FOREIGN KEY (id_funcionario)
        REFERENCES funcionario_validacion (id_usuario) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT ck_dispositivo_estado CHECK (estado IN ('ACTIVO','INACTIVO','BLOQUEADO'))
);

-- =====================================================================
-- 3. INFRAESTRUCTURA Y EVENTOS
-- =====================================================================

CREATE TABLE estadio (
    id_estadio BIGSERIAL    NOT NULL,
    nombre     VARCHAR(120) NOT NULL,
    id_pais    INT          NOT NULL,    -- pais sede (no se repite como texto)
    ciudad     VARCHAR(80)  NOT NULL,
    direccion  VARCHAR(160) NOT NULL,
    CONSTRAINT pk_estadio      PRIMARY KEY (id_estadio),
    CONSTRAINT uq_estadio_nom  UNIQUE (id_pais, nombre),
    CONSTRAINT fk_estadio_sede FOREIGN KEY (id_pais)
        REFERENCES pais_sede (id_pais) ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE TABLE sector (
    id_sector        BIGSERIAL    NOT NULL,
    id_estadio       BIGINT       NOT NULL,
    nombre_sector    CHAR(1)      NOT NULL,
    capacidad_maxima INT          NOT NULL,
    precio_base      NUMERIC(12,2) NOT NULL,
    CONSTRAINT pk_sector        PRIMARY KEY (id_sector),
    CONSTRAINT uq_sector        UNIQUE (id_estadio, nombre_sector),
    CONSTRAINT fk_sector_estadio FOREIGN KEY (id_estadio)
        REFERENCES estadio (id_estadio) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT ck_sector_nombre  CHECK (nombre_sector IN ('A','B','C','D')),
    CONSTRAINT ck_sector_cap     CHECK (capacidad_maxima > 0),
    CONSTRAINT ck_sector_precio  CHECK (precio_base >= 0)
);

CREATE TABLE seleccion (
    id_seleccion BIGSERIAL   NOT NULL,
    nombre       VARCHAR(60) NOT NULL,
    codigo_fifa  CHAR(3)     NOT NULL,
    CONSTRAINT pk_seleccion     PRIMARY KEY (id_seleccion),
    CONSTRAINT uq_seleccion_nom UNIQUE (nombre),
    CONSTRAINT uq_seleccion_fifa UNIQUE (codigo_fifa)
);

CREATE TABLE evento (
    id_evento        BIGSERIAL   NOT NULL,
    id_estadio       BIGINT      NOT NULL,
    id_seleccion_local     BIGINT NOT NULL,
    id_seleccion_visitante BIGINT NOT NULL,
    fecha_hora_inicio TIMESTAMPTZ NOT NULL,
    duracion_minutos  INT        NOT NULL DEFAULT 120,
    estado            VARCHAR(12) NOT NULL DEFAULT 'PROGRAMADO',
    id_administrador  BIGINT      NOT NULL,        -- quien da de alta el evento
    -- rango temporal mantenido por trigger (tstzrange no es inmutable, no puede ser GENERATED)
    periodo tstzrange,
    CONSTRAINT pk_evento        PRIMARY KEY (id_evento),
    CONSTRAINT fk_evento_estadio FOREIGN KEY (id_estadio)
        REFERENCES estadio (id_estadio) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_evento_local  FOREIGN KEY (id_seleccion_local)
        REFERENCES seleccion (id_seleccion) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_evento_visit  FOREIGN KEY (id_seleccion_visitante)
        REFERENCES seleccion (id_seleccion) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_evento_admin  FOREIGN KEY (id_administrador)
        REFERENCES administrador_pais (id_usuario) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT ck_evento_equipos CHECK (id_seleccion_local <> id_seleccion_visitante),
    CONSTRAINT ck_evento_dur     CHECK (duracion_minutos > 0),
    CONSTRAINT ck_evento_estado  CHECK (estado IN ('PROGRAMADO','EN_CURSO','FINALIZADO','CANCELADO')),
    -- ANTI-SUPERPOSICION: no dos eventos solapados en el mismo estadio
    CONSTRAINT ex_evento_solape  EXCLUDE USING gist
        (id_estadio WITH =, periodo WITH &&)
);

-- Trigger que calcula automaticamente el rango temporal del evento
CREATE OR REPLACE FUNCTION fn_set_evento_periodo()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.periodo := tstzrange(
        NEW.fecha_hora_inicio,
        NEW.fecha_hora_inicio + (NEW.duracion_minutos * INTERVAL '1 minute')
    );
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_evento_periodo
BEFORE INSERT OR UPDATE OF fecha_hora_inicio, duracion_minutos
ON evento
FOR EACH ROW EXECUTE FUNCTION fn_set_evento_periodo();

-- Sectores HABILITADOS para un evento (asociativa evento<->sector + cupo/precio)
CREATE TABLE evento_sector (
    id_evento_sector BIGSERIAL    NOT NULL,
    id_evento        BIGINT       NOT NULL,
    id_sector        BIGINT       NOT NULL,
    cupo_habilitado  INT          NOT NULL,
    precio           NUMERIC(12,2) NOT NULL,
    CONSTRAINT pk_evento_sector  PRIMARY KEY (id_evento_sector),
    CONSTRAINT uq_evento_sector  UNIQUE (id_evento, id_sector),
    CONSTRAINT fk_es_evento      FOREIGN KEY (id_evento)
        REFERENCES evento (id_evento) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_es_sector      FOREIGN KEY (id_sector)
        REFERENCES sector (id_sector) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT ck_es_cupo        CHECK (cupo_habilitado > 0),
    CONSTRAINT ck_es_precio      CHECK (precio >= 0)
);

-- =====================================================================
-- 4. VENTA, COMISION Y ENTRADAS
-- =====================================================================

-- Tasa de comision con vigencia historica (la tasa puede variar en el tiempo)
CREATE TABLE comision (
    id_comision  BIGSERIAL    NOT NULL,
    porcentaje   NUMERIC(5,2) NOT NULL,
    fecha_inicio DATE         NOT NULL,
    fecha_fin    DATE         NULL,          -- NULL = vigente
    CONSTRAINT pk_comision      PRIMARY KEY (id_comision),
    CONSTRAINT ck_comision_pct  CHECK (porcentaje >= 0 AND porcentaje <= 100),
    CONSTRAINT ck_comision_vig  CHECK (fecha_fin IS NULL OR fecha_fin >= fecha_inicio),
    -- una sola tasa vigente por intervalo (sin solapes)
    CONSTRAINT ex_comision_vig  EXCLUDE USING gist
        (daterange(fecha_inicio, COALESCE(fecha_fin, 'infinity'::date), '[]') WITH &&)
);

CREATE TABLE venta (
    id_venta        BIGSERIAL   NOT NULL,
    id_usuario      BIGINT      NOT NULL,        -- comprador
    fecha           TIMESTAMPTZ NOT NULL DEFAULT now(),
    estado          dom_estado_venta NOT NULL DEFAULT 'PENDIENTE',
    id_comision     BIGINT      NOT NULL,        -- tasa aplicada
    porcentaje_aplicado NUMERIC(5,2) NOT NULL,   -- snapshot de la tasa
    subtotal        NUMERIC(14,2) NOT NULL DEFAULT 0,
    monto_comision  NUMERIC(14,2) NOT NULL DEFAULT 0,
    monto_total     NUMERIC(14,2) NOT NULL DEFAULT 0,
    CONSTRAINT pk_venta       PRIMARY KEY (id_venta),
    CONSTRAINT fk_venta_user  FOREIGN KEY (id_usuario)
        REFERENCES usuario_general (id_usuario) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_venta_comision FOREIGN KEY (id_comision)
        REFERENCES comision (id_comision) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT ck_venta_montos CHECK (subtotal >= 0 AND monto_comision >= 0 AND monto_total >= 0)
);

CREATE TABLE entrada (
    id_entrada       BIGSERIAL   NOT NULL,
    codigo_unico     UUID        NOT NULL DEFAULT gen_random_uuid(),
    id_venta         BIGINT      NOT NULL,        -- venta de origen
    id_evento_sector BIGINT      NOT NULL,        -- evento+sector concreto
    id_usuario_actual BIGINT     NOT NULL,        -- TITULAR ACTUAL (cadena de custodia)
    fecha_emision    TIMESTAMPTZ NOT NULL DEFAULT now(),
    estado           dom_estado_entrada NOT NULL DEFAULT 'EMITIDA',
    precio           NUMERIC(12,2) NOT NULL,
    cantidad_transferencias INT  NOT NULL DEFAULT 0,
    CONSTRAINT pk_entrada       PRIMARY KEY (id_entrada),
    CONSTRAINT uq_entrada_codigo UNIQUE (codigo_unico),
    CONSTRAINT fk_entrada_venta FOREIGN KEY (id_venta)
        REFERENCES venta (id_venta) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_entrada_es    FOREIGN KEY (id_evento_sector)
        REFERENCES evento_sector (id_evento_sector) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_entrada_user  FOREIGN KEY (id_usuario_actual)
        REFERENCES usuario_general (id_usuario) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT ck_entrada_precio CHECK (precio >= 0),
    CONSTRAINT ck_entrada_transf CHECK (cantidad_transferencias BETWEEN 0 AND 3)
);

-- Log historico de transferencias (cadena de custodia)
CREATE TABLE transferencia (
    id_transferencia  BIGSERIAL   NOT NULL,
    id_entrada        BIGINT      NOT NULL,
    id_usuario_origen BIGINT      NOT NULL,
    id_usuario_destino BIGINT     NOT NULL,
    fecha_transferencia TIMESTAMPTZ NOT NULL DEFAULT now(),
    fecha_aceptacion  TIMESTAMPTZ NULL,
    estado            dom_estado_transf NOT NULL DEFAULT 'PENDIENTE',
    CONSTRAINT pk_transferencia   PRIMARY KEY (id_transferencia),
    CONSTRAINT fk_transf_entrada  FOREIGN KEY (id_entrada)
        REFERENCES entrada (id_entrada) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_transf_origen   FOREIGN KEY (id_usuario_origen)
        REFERENCES usuario_general (id_usuario) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_transf_destino  FOREIGN KEY (id_usuario_destino)
        REFERENCES usuario_general (id_usuario) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT ck_transf_distintos CHECK (id_usuario_origen <> id_usuario_destino),
    CONSTRAINT ck_transf_fechas   CHECK (fecha_aceptacion IS NULL OR fecha_aceptacion >= fecha_transferencia)
);

-- QR dinamico: un token cambia cada 30s; solo uno activo por entrada
CREATE TABLE token_qr (
    id_token        BIGSERIAL   NOT NULL,
    id_entrada      BIGINT      NOT NULL,
    codigo_token    VARCHAR(120) NOT NULL,
    fecha_generacion TIMESTAMPTZ NOT NULL DEFAULT now(),
    fecha_expiracion TIMESTAMPTZ NOT NULL,
    activo          BOOLEAN     NOT NULL DEFAULT TRUE,
    CONSTRAINT pk_token        PRIMARY KEY (id_token),
    CONSTRAINT uq_token_codigo UNIQUE (codigo_token),
    CONSTRAINT fk_token_entrada FOREIGN KEY (id_entrada)
        REFERENCES entrada (id_entrada) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT ck_token_fechas CHECK (fecha_expiracion > fecha_generacion)
);

-- Validacion de ingreso (1:1 con entrada: consumo irreversible)
CREATE TABLE validacion (
    id_validacion    BIGSERIAL   NOT NULL,
    id_entrada       BIGINT      NOT NULL,
    id_token         BIGINT      NOT NULL,        -- codigo especifico aceptado
    id_funcionario   BIGINT      NOT NULL,
    id_dispositivo   BIGINT      NOT NULL,
    fecha_hora       TIMESTAMPTZ NOT NULL DEFAULT now(),
    codigo_qr_validado VARCHAR(120) NOT NULL,
    resultado        dom_resultado_val NOT NULL,
    CONSTRAINT pk_validacion      PRIMARY KEY (id_validacion),
    -- uq_validacion_aceptada es un UNIQUE PARCIAL (ver indices abajo):
    -- permite multiples filas RECHAZADO por entrada, pero solo una ACEPTADO.
    CONSTRAINT fk_val_entrada     FOREIGN KEY (id_entrada)
        REFERENCES entrada (id_entrada) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_val_token       FOREIGN KEY (id_token)
        REFERENCES token_qr (id_token) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_val_func        FOREIGN KEY (id_funcionario)
        REFERENCES funcionario_validacion (id_usuario) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_val_disp        FOREIGN KEY (id_dispositivo)
        REFERENCES dispositivo (id_dispositivo) ON UPDATE CASCADE ON DELETE RESTRICT
);

-- Asignacion de funcionarios a sectores durante un evento
CREATE TABLE asignacion_funcionario_sector (
    id_asignacion  BIGSERIAL NOT NULL,
    id_funcionario BIGINT    NOT NULL,
    id_evento      BIGINT    NOT NULL,
    id_sector      BIGINT    NOT NULL,
    CONSTRAINT pk_asignacion  PRIMARY KEY (id_asignacion),
    CONSTRAINT uq_asignacion  UNIQUE (id_funcionario, id_evento, id_sector),
    CONSTRAINT fk_asig_func   FOREIGN KEY (id_funcionario)
        REFERENCES funcionario_validacion (id_usuario) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_asig_evento FOREIGN KEY (id_evento)
        REFERENCES evento (id_evento) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_asig_sector FOREIGN KEY (id_sector)
        REFERENCES sector (id_sector) ON UPDATE CASCADE ON DELETE RESTRICT
);

-- Auditoria de transferencias (poblada por trigger)
CREATE TABLE auditoria_transferencia (
    id_auditoria      BIGSERIAL   NOT NULL,
    id_transferencia  BIGINT      NULL,
    id_entrada        BIGINT      NOT NULL,
    id_usuario_origen BIGINT      NULL,
    id_usuario_destino BIGINT     NULL,
    estado_anterior   VARCHAR(12) NULL,
    estado_nuevo      VARCHAR(12) NULL,
    accion            VARCHAR(20) NOT NULL,
    usuario_bd        VARCHAR(80) NOT NULL DEFAULT current_user,
    fecha_evento      TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT pk_auditoria_transf PRIMARY KEY (id_auditoria)
);

-- =====================================================================
-- 5. INDICES (Fase 3 - performance)
-- =====================================================================
CREATE INDEX idx_documento_usuario   ON documento (id_usuario);
CREATE INDEX idx_telefono_usuario    ON telefono (id_usuario);
CREATE INDEX idx_dispositivo_func    ON dispositivo (id_funcionario);
CREATE INDEX idx_sector_estadio      ON sector (id_estadio);
CREATE INDEX idx_evento_estadio      ON evento (id_estadio);
CREATE INDEX idx_evento_fecha        ON evento (fecha_hora_inicio);
CREATE INDEX idx_evento_admin        ON evento (id_administrador);
CREATE INDEX idx_es_evento           ON evento_sector (id_evento);
CREATE INDEX idx_es_sector           ON evento_sector (id_sector);
CREATE INDEX idx_venta_usuario       ON venta (id_usuario);
CREATE INDEX idx_venta_fecha         ON venta (fecha);
CREATE INDEX idx_entrada_venta       ON entrada (id_venta);
CREATE INDEX idx_entrada_es          ON entrada (id_evento_sector);
CREATE INDEX idx_entrada_actual      ON entrada (id_usuario_actual);
CREATE INDEX idx_entrada_estado      ON entrada (estado);
CREATE INDEX idx_transf_entrada      ON transferencia (id_entrada);
CREATE INDEX idx_transf_origen       ON transferencia (id_usuario_origen);
CREATE INDEX idx_transf_destino      ON transferencia (id_usuario_destino);
CREATE INDEX idx_token_entrada       ON token_qr (id_entrada);
CREATE INDEX idx_val_func            ON validacion (id_funcionario);
CREATE INDEX idx_asig_evento         ON asignacion_funcionario_sector (id_evento);
CREATE INDEX idx_audit_entrada       ON auditoria_transferencia (id_entrada);

-- Solo UN token activo por entrada (indice unico parcial)
CREATE UNIQUE INDEX uq_token_activo
    ON token_qr (id_entrada) WHERE (activo = TRUE);

-- Solo UNA validacion ACEPTADA por entrada (indice unico parcial).
-- Permite multiples registros RECHAZADO para auditoria de intentos fallidos.
CREATE UNIQUE INDEX uq_validacion_aceptada
    ON validacion (id_entrada) WHERE (resultado = 'ACEPTADO');

-- =====================================================================
-- FIN DDL
-- =====================================================================
