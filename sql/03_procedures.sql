-- =====================================================================
--  FASE 5 - PROCEDIMIENTOS ALMACENADOS Y FUNCIONES DE REPORTE
--  Requiere 01_ddl.sql y 02_triggers.sql.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) REGISTRAR COMPRA
--    Crea la venta y emite N entradas (1..5) para los evento_sector dados.
--    Los triggers aplican: max 5, aforo, calculo de comision y titularidad.
--    p_evento_sectores: arreglo de id_evento_sector (uno por entrada).
-- ---------------------------------------------------------------------
CREATE OR REPLACE PROCEDURE sp_registrar_compra(
    IN  p_id_usuario        BIGINT,
    IN  p_evento_sectores   BIGINT[],
    OUT p_id_venta          BIGINT
)
LANGUAGE plpgsql AS $$
DECLARE
    v_es     BIGINT;
    v_cant   INT := array_length(p_evento_sectores, 1);
BEGIN
    IF v_cant IS NULL OR v_cant < 1 THEN
        RAISE EXCEPTION 'La compra debe incluir al menos una entrada';
    END IF;
    IF v_cant > 5 THEN
        RAISE EXCEPTION 'No se pueden comprar mas de 5 entradas en una misma transaccion';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM usuario_general WHERE id_usuario = p_id_usuario) THEN
        RAISE EXCEPTION 'El usuario % no es un usuario general habilitado para comprar', p_id_usuario;
    END IF;

    INSERT INTO venta(id_usuario, fecha, estado, id_comision, porcentaje_aplicado)
    VALUES (p_id_usuario, now(), 'PENDIENTE', 0, 0)   -- id_comision/pct los fija el trigger
    RETURNING id_venta INTO p_id_venta;

    FOREACH v_es IN ARRAY p_evento_sectores LOOP
        INSERT INTO entrada(id_venta, id_evento_sector, precio, estado)
        VALUES (p_id_venta, v_es, NULL, 'EMITIDA');   -- precio lo fija el trigger
    END LOOP;

    UPDATE venta SET estado = 'CONFIRMADA' WHERE id_venta = p_id_venta;
END;
$$;

-- ---------------------------------------------------------------------
-- 2) TRANSFERIR ENTRADA (inicia transferencia PENDIENTE)
-- ---------------------------------------------------------------------
CREATE OR REPLACE PROCEDURE sp_transferir_entrada(
    IN  p_id_entrada     BIGINT,
    IN  p_id_destino     BIGINT,
    IN  p_id_solicitante BIGINT,     -- usuario autenticado (debe ser el titular)
    OUT p_id_transferencia BIGINT
)
LANGUAGE plpgsql AS $$
DECLARE
    v_origen BIGINT;
BEGIN
    SELECT id_usuario_actual INTO v_origen FROM entrada WHERE id_entrada = p_id_entrada;
    IF v_origen IS NULL THEN
        RAISE EXCEPTION 'Entrada % inexistente', p_id_entrada;
    END IF;
    -- Solo el titular actual puede iniciar la transferencia de SU entrada
    IF v_origen <> p_id_solicitante THEN
        RAISE EXCEPTION 'El usuario % no es el titular de la entrada %', p_id_solicitante, p_id_entrada;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM usuario_general WHERE id_usuario = p_id_destino) THEN
        RAISE EXCEPTION 'El destino % no es un usuario general valido', p_id_destino;
    END IF;

    -- Las validaciones de limite (3), titularidad y estado las aplica el trigger
    INSERT INTO transferencia(id_entrada, id_usuario_origen, id_usuario_destino, estado)
    VALUES (p_id_entrada, v_origen, p_id_destino, 'PENDIENTE')
    RETURNING id_transferencia INTO p_id_transferencia;
END;
$$;

-- 2b) ACEPTAR TRANSFERENCIA (solo el destinatario; el trigger cambia el titular)
CREATE OR REPLACE PROCEDURE sp_aceptar_transferencia(
    IN p_id_transferencia BIGINT,
    IN p_id_solicitante   BIGINT      -- usuario autenticado (debe ser el destino)
)
LANGUAGE plpgsql AS $$
DECLARE
    v_estado  dom_estado_transf;
    v_destino BIGINT;
BEGIN
    SELECT estado, id_usuario_destino INTO v_estado, v_destino
      FROM transferencia WHERE id_transferencia = p_id_transferencia;
    IF v_estado IS NULL THEN
        RAISE EXCEPTION 'Transferencia % inexistente', p_id_transferencia;
    END IF;
    IF v_destino <> p_id_solicitante THEN
        RAISE EXCEPTION 'Solo el destinatario puede aceptar la transferencia %', p_id_transferencia;
    END IF;
    IF v_estado <> 'PENDIENTE' THEN
        RAISE EXCEPTION 'La transferencia % no esta pendiente (estado %)', p_id_transferencia, v_estado;
    END IF;

    UPDATE transferencia
       SET estado = 'ACEPTADA', fecha_aceptacion = now()
     WHERE id_transferencia = p_id_transferencia;
END;
$$;

-- ---------------------------------------------------------------------
-- 3) VALIDAR ACCESO (registra ingreso; los triggers consumen la entrada)
--
--    Flujo ACEPTADO: INSERT con resultado='ACEPTADO' → trigger valida todo
--                   → trigger AFTER marca entrada CONSUMIDA.
--    Flujo RECHAZADO: el trigger BEFORE lanza EXCEPTION → el handler captura
--                   y hace INSERT con resultado='RECHAZADO' (el trigger BEFORE
--                   detecta resultado='RECHAZADO' y salta todas las validaciones).
--    Todos los intentos quedan en validacion para auditoria completa.
-- ---------------------------------------------------------------------
CREATE OR REPLACE PROCEDURE sp_validar_acceso(
    IN  p_id_entrada     BIGINT,
    IN  p_id_token       BIGINT,
    IN  p_id_funcionario BIGINT,
    IN  p_id_dispositivo BIGINT,
    OUT p_resultado      VARCHAR
)
LANGUAGE plpgsql AS $$
DECLARE
    v_codigo  VARCHAR(120);
    v_motivo  TEXT;
BEGIN
    SELECT codigo_token INTO v_codigo FROM token_qr WHERE id_token = p_id_token;

    -- Intento ACEPTADO: el trigger fn_validacion_before valida todas las reglas.
    INSERT INTO validacion(id_entrada, id_token, id_funcionario, id_dispositivo,
                           codigo_qr_validado, resultado)
    VALUES (p_id_entrada, p_id_token, p_id_funcionario, p_id_dispositivo,
            COALESCE(v_codigo, ''), 'ACEPTADO');

    p_resultado := 'ACEPTADO';

EXCEPTION WHEN OTHERS THEN
    -- PL/pgSQL revierte al savepoint implicito del bloque; podemos hacer DML nuevo.
    v_motivo := SQLERRM;

    -- Registrar el intento fallido. El trigger ve resultado='RECHAZADO' y omite validaciones.
    -- Guard anidado: si ni siquiera se puede auditar (ej. id inexistente que viola
    -- una FK), no volvemos a abortar; devolvemos igual el motivo del rechazo.
    BEGIN
        INSERT INTO validacion(id_entrada, id_token, id_funcionario, id_dispositivo,
                               codigo_qr_validado, resultado)
        VALUES (p_id_entrada, p_id_token, p_id_funcionario, p_id_dispositivo,
                COALESCE(v_codigo, ''), 'RECHAZADO');
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;

    p_resultado := 'RECHAZADO: ' || v_motivo;
END;
$$;

-- ---------------------------------------------------------------------
-- 4) GENERAR REPORTES (funciones que devuelven tablas)
-- ---------------------------------------------------------------------

-- 4a) Ranking de compradores (por cantidad de entradas y monto gastado)
CREATE OR REPLACE FUNCTION fn_reporte_ranking_compradores(p_top INT DEFAULT 10)
RETURNS TABLE (
    id_usuario     BIGINT,
    nombre         TEXT,
    email          TEXT,
    cant_entradas  BIGINT,
    monto_total    NUMERIC
) LANGUAGE sql AS $$
    SELECT u.id_usuario,
           (u.nombre || ' ' || u.apellido)::text,
           u.email::text,
           COUNT(e.id_entrada),
           COALESCE(SUM(e.precio),0)
      FROM usuario u
      JOIN venta v  ON v.id_usuario = u.id_usuario
      JOIN entrada e ON e.id_venta = v.id_venta AND e.estado <> 'ANULADA'
     GROUP BY u.id_usuario, u.nombre, u.apellido, u.email
     ORDER BY COUNT(e.id_entrada) DESC, SUM(e.precio) DESC
     LIMIT p_top;
$$;

-- 4b) Eventos con mas ventas
CREATE OR REPLACE FUNCTION fn_reporte_eventos_top(p_top INT DEFAULT 10)
RETURNS TABLE (
    id_evento      BIGINT,
    partido        TEXT,
    estadio        TEXT,
    fecha          TIMESTAMPTZ,
    entradas_vendidas BIGINT,
    recaudacion    NUMERIC
) LANGUAGE sql AS $$
    SELECT ev.id_evento,
           (sl.nombre || ' vs ' || sv.nombre)::text,
           es.nombre::text,
           ev.fecha_hora_inicio,
           COUNT(e.id_entrada),
           COALESCE(SUM(e.precio),0)
      FROM evento ev
      JOIN seleccion sl ON sl.id_seleccion = ev.id_seleccion_local
      JOIN seleccion sv ON sv.id_seleccion = ev.id_seleccion_visitante
      JOIN estadio  es  ON es.id_estadio   = ev.id_estadio
      JOIN evento_sector esec ON esec.id_evento = ev.id_evento
      LEFT JOIN entrada e ON e.id_evento_sector = esec.id_evento_sector AND e.estado <> 'ANULADA'
     GROUP BY ev.id_evento, sl.nombre, sv.nombre, es.nombre, ev.fecha_hora_inicio
     ORDER BY COUNT(e.id_entrada) DESC
     LIMIT p_top;
$$;

-- 4c) Estadisticas por estadio
CREATE OR REPLACE FUNCTION fn_reporte_estadisticas_estadio()
RETURNS TABLE (
    id_estadio        BIGINT,
    estadio           TEXT,
    eventos           BIGINT,
    cupo_total        BIGINT,
    entradas_vendidas BIGINT,
    recaudacion       NUMERIC,
    ocupacion_pct     NUMERIC
) LANGUAGE sql AS $$
    WITH cupos AS (   -- cupo total habilitado por estadio
        SELECT ev.id_estadio,
               COUNT(DISTINCT ev.id_evento) AS eventos,
               COALESCE(SUM(esec.cupo_habilitado),0) AS cupo_total
          FROM evento ev
          JOIN evento_sector esec ON esec.id_evento = ev.id_evento
         GROUP BY ev.id_estadio
    ),
    ventas AS (       -- entradas y recaudacion por estadio
        SELECT ev.id_estadio,
               COUNT(e.id_entrada) AS entradas,
               COALESCE(SUM(e.precio),0) AS recaudacion
          FROM evento ev
          JOIN evento_sector esec ON esec.id_evento = ev.id_evento
          JOIN entrada e ON e.id_evento_sector = esec.id_evento_sector AND e.estado <> 'ANULADA'
         GROUP BY ev.id_estadio
    )
    SELECT es.id_estadio,
           es.nombre::text,
           COALESCE(c.eventos,0),
           COALESCE(c.cupo_total,0),
           COALESCE(v.entradas,0),
           COALESCE(v.recaudacion,0),
           ROUND(100.0 * COALESCE(v.entradas,0) / NULLIF(c.cupo_total,0), 2)
      FROM estadio es
      LEFT JOIN cupos  c ON c.id_estadio = es.id_estadio
      LEFT JOIN ventas v ON v.id_estadio = es.id_estadio
     ORDER BY 6 DESC;
$$;

-- ---------------------------------------------------------------------
-- 5) REGISTRO DE USUARIO GENERAL
--    Alta atomica de un consumidor: direccion + usuario + documento +
--    subtipo usuario_general. La app pasa el hash bcrypt ya calculado.
-- ---------------------------------------------------------------------
CREATE OR REPLACE PROCEDURE sp_registrar_usuario_general(
    IN  p_email          VARCHAR,   -- la columna usuario.email (citext) castea solo
    IN  p_password_hash  VARCHAR,
    IN  p_nombre         VARCHAR,
    IN  p_apellido       VARCHAR,
    IN  p_dir_id_pais    INT,
    IN  p_localidad      VARCHAR,
    IN  p_calle          VARCHAR,
    IN  p_numero         VARCHAR,
    IN  p_codigo_postal  VARCHAR,
    IN  p_doc_id_pais    INT,
    IN  p_tipo_documento VARCHAR,
    IN  p_doc_numero     VARCHAR,
    OUT p_id_usuario     BIGINT
)
LANGUAGE plpgsql AS $$
DECLARE
    v_id_direccion BIGINT;
BEGIN
    INSERT INTO direccion(id_pais, localidad, calle, numero, codigo_postal)
    VALUES (p_dir_id_pais, p_localidad, p_calle, p_numero, p_codigo_postal)
    RETURNING id_direccion INTO v_id_direccion;

    INSERT INTO usuario(email, nombre, apellido, id_direccion, password_hash)
    VALUES (p_email, p_nombre, p_apellido, v_id_direccion, p_password_hash)
    RETURNING id_usuario INTO p_id_usuario;

    INSERT INTO documento(id_usuario, id_pais, tipo_documento, numero)
    VALUES (p_id_usuario, p_doc_id_pais, p_tipo_documento, p_doc_numero);

    INSERT INTO usuario_general(id_usuario, identidad_verificada)
    VALUES (p_id_usuario, FALSE);
END;
$$;

-- ---------------------------------------------------------------------
-- 6) ADMINISTRACION DE INFRAESTRUCTURA Y EVENTOS (rol ADMINISTRADOR_PAIS)
--    El administrador solo puede gestionar su jurisdiccion (su pais sede).
-- ---------------------------------------------------------------------

-- Helper: pais sede asignado al administrador (NULL si no es administrador)
CREATE OR REPLACE FUNCTION fn_pais_admin(p_id_admin BIGINT)
RETURNS INT LANGUAGE sql STABLE AS $$
    SELECT id_pais FROM administrador_pais WHERE id_usuario = p_id_admin;
$$;

-- 6a) Alta de estadio en la jurisdiccion (pais sede) del administrador
CREATE OR REPLACE PROCEDURE sp_crear_estadio(
    IN  p_id_administrador BIGINT,
    IN  p_nombre    VARCHAR,
    IN  p_id_pais   INT,
    IN  p_ciudad    VARCHAR,
    IN  p_direccion VARCHAR,
    OUT p_id_estadio BIGINT
)
LANGUAGE plpgsql AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pais_sede WHERE id_pais = p_id_pais) THEN
        RAISE EXCEPTION 'El pais % no es sede del mundial', p_id_pais;
    END IF;
    IF p_id_pais IS DISTINCT FROM fn_pais_admin(p_id_administrador) THEN
        RAISE EXCEPTION 'El administrador % solo puede crear estadios en su pais sede', p_id_administrador;
    END IF;
    INSERT INTO estadio(nombre, id_pais, ciudad, direccion)
    VALUES (p_nombre, p_id_pais, p_ciudad, p_direccion)
    RETURNING id_estadio INTO p_id_estadio;
END;
$$;

-- 6b) Alta de sector dentro de un estadio (A/B/C/D, capacidad, precio base)
CREATE OR REPLACE PROCEDURE sp_agregar_sector(
    IN  p_id_administrador BIGINT,
    IN  p_id_estadio   BIGINT,
    IN  p_nombre       CHAR,
    IN  p_capacidad    INT,
    IN  p_precio_base  NUMERIC,
    OUT p_id_sector    BIGINT
)
LANGUAGE plpgsql AS $$
DECLARE
    v_pais_estadio INT;
BEGIN
    SELECT id_pais INTO v_pais_estadio FROM estadio WHERE id_estadio = p_id_estadio;
    IF v_pais_estadio IS NULL THEN
        RAISE EXCEPTION 'Estadio % inexistente', p_id_estadio;
    END IF;
    IF v_pais_estadio IS DISTINCT FROM fn_pais_admin(p_id_administrador) THEN
        RAISE EXCEPTION 'El estadio % no pertenece a la jurisdiccion del administrador %', p_id_estadio, p_id_administrador;
    END IF;
    INSERT INTO sector(id_estadio, nombre_sector, capacidad_maxima, precio_base)
    VALUES (p_id_estadio, p_nombre, p_capacidad, p_precio_base)
    RETURNING id_sector INTO p_id_sector;
END;
$$;

-- 6c) Programar un evento. Los triggers calculan el periodo y bloquean solapes.
CREATE OR REPLACE PROCEDURE sp_crear_evento(
    IN  p_id_administrador  BIGINT,
    IN  p_id_estadio       BIGINT,
    IN  p_id_local         BIGINT,
    IN  p_id_visitante     BIGINT,
    IN  p_fecha_hora       TIMESTAMPTZ,
    IN  p_duracion_minutos INT,
    OUT p_id_evento        BIGINT
)
LANGUAGE plpgsql AS $$
DECLARE
    v_pais_estadio INT;
BEGIN
    SELECT id_pais INTO v_pais_estadio FROM estadio WHERE id_estadio = p_id_estadio;
    IF v_pais_estadio IS NULL THEN
        RAISE EXCEPTION 'Estadio % inexistente', p_id_estadio;
    END IF;
    IF v_pais_estadio IS DISTINCT FROM fn_pais_admin(p_id_administrador) THEN
        RAISE EXCEPTION 'El administrador % solo puede programar eventos en estadios de su pais sede', p_id_administrador;
    END IF;
    INSERT INTO evento(id_estadio, id_seleccion_local, id_seleccion_visitante,
                       fecha_hora_inicio, duracion_minutos, id_administrador)
    VALUES (p_id_estadio, p_id_local, p_id_visitante,
            p_fecha_hora, COALESCE(p_duracion_minutos, 120), p_id_administrador)
    RETURNING id_evento INTO p_id_evento;
END;
$$;

-- 6d) Habilitar un sector para un evento (cupo y precio para ese partido)
CREATE OR REPLACE PROCEDURE sp_habilitar_sector(
    IN  p_id_administrador BIGINT,
    IN  p_id_evento       BIGINT,
    IN  p_id_sector       BIGINT,
    IN  p_cupo            INT,
    IN  p_precio          NUMERIC,
    OUT p_id_evento_sector BIGINT
)
LANGUAGE plpgsql AS $$
DECLARE
    v_cap_max INT;
    v_pais_evento INT;
BEGIN
    SELECT est.id_pais INTO v_pais_evento
      FROM evento ev JOIN estadio est ON est.id_estadio = ev.id_estadio
     WHERE ev.id_evento = p_id_evento;
    IF v_pais_evento IS NULL THEN
        RAISE EXCEPTION 'Evento % inexistente', p_id_evento;
    END IF;
    IF v_pais_evento IS DISTINCT FROM fn_pais_admin(p_id_administrador) THEN
        RAISE EXCEPTION 'El evento % no pertenece a la jurisdiccion del administrador %', p_id_evento, p_id_administrador;
    END IF;

    SELECT capacidad_maxima INTO v_cap_max FROM sector WHERE id_sector = p_id_sector;
    IF v_cap_max IS NULL THEN
        RAISE EXCEPTION 'Sector % inexistente', p_id_sector;
    END IF;
    IF p_cupo > v_cap_max THEN
        RAISE EXCEPTION 'El cupo (%) no puede superar la capacidad del sector (%)', p_cupo, v_cap_max;
    END IF;
    INSERT INTO evento_sector(id_evento, id_sector, cupo_habilitado, precio)
    VALUES (p_id_evento, p_id_sector, p_cupo, p_precio)
    RETURNING id_evento_sector INTO p_id_evento_sector;
END;
$$;

-- 6e) Cancelar un evento (libera la franja del estadio via trigger)
CREATE OR REPLACE PROCEDURE sp_cancelar_evento(
    IN p_id_administrador BIGINT,
    IN p_id_evento        BIGINT
)
LANGUAGE plpgsql AS $$
DECLARE
    v_pais_evento INT;
BEGIN
    SELECT est.id_pais INTO v_pais_evento
      FROM evento ev JOIN estadio est ON est.id_estadio = ev.id_estadio
     WHERE ev.id_evento = p_id_evento;
    IF v_pais_evento IS NULL THEN
        RAISE EXCEPTION 'Evento % inexistente', p_id_evento;
    END IF;
    IF v_pais_evento IS DISTINCT FROM fn_pais_admin(p_id_administrador) THEN
        RAISE EXCEPTION 'El evento % no pertenece a la jurisdiccion del administrador %', p_id_evento, p_id_administrador;
    END IF;
    UPDATE evento SET estado = 'CANCELADO' WHERE id_evento = p_id_evento;
END;
$$;

-- ---------------------------------------------------------------------
-- 7) PAGO DE LA VENTA (estado CONFIRMADA -> PAGA). Solo el dueno de la venta.
-- ---------------------------------------------------------------------
CREATE OR REPLACE PROCEDURE sp_marcar_venta_paga(
    IN p_id_venta   BIGINT,
    IN p_id_usuario BIGINT
)
LANGUAGE plpgsql AS $$
DECLARE
    v_estado dom_estado_venta;
    v_dueno  BIGINT;
BEGIN
    SELECT estado, id_usuario INTO v_estado, v_dueno FROM venta WHERE id_venta = p_id_venta;
    IF v_estado IS NULL THEN
        RAISE EXCEPTION 'Venta % inexistente', p_id_venta;
    END IF;
    IF v_dueno <> p_id_usuario THEN
        RAISE EXCEPTION 'La venta % no pertenece al usuario %', p_id_venta, p_id_usuario;
    END IF;
    IF v_estado <> 'CONFIRMADA' THEN
        RAISE EXCEPTION 'Solo se puede pagar una venta CONFIRMADA (estado actual: %)', v_estado;
    END IF;
    UPDATE venta SET estado = 'PAGA' WHERE id_venta = p_id_venta;
END;
$$;

-- ---------------------------------------------------------------------
-- 7b) GENERAR TOKEN QR DINAMICO (rota cada ~30s desde el cliente).
--     Solo el titular de la entrada. El trigger desactiva el token previo,
--     garantizando un unico token activo por entrada.
-- ---------------------------------------------------------------------
CREATE OR REPLACE PROCEDURE sp_generar_token(
    IN  p_id_entrada BIGINT,
    IN  p_id_usuario BIGINT,
    OUT p_codigo     VARCHAR,
    OUT p_expira     TIMESTAMPTZ
)
LANGUAGE plpgsql AS $$
DECLARE
    v_titular BIGINT;
    v_estado  dom_estado_entrada;
BEGIN
    SELECT id_usuario_actual, estado INTO v_titular, v_estado
      FROM entrada WHERE id_entrada = p_id_entrada;
    IF v_titular IS NULL THEN
        RAISE EXCEPTION 'Entrada % inexistente', p_id_entrada;
    END IF;
    IF v_titular <> p_id_usuario THEN
        RAISE EXCEPTION 'La entrada % no pertenece al usuario %', p_id_entrada, p_id_usuario;
    END IF;
    IF v_estado = 'CONSUMIDA' THEN
        RAISE EXCEPTION 'La entrada % ya fue consumida', p_id_entrada;
    END IF;

    p_codigo := encode(gen_random_bytes(16), 'hex');   -- token aleatorio (pgcrypto)
    p_expira := now() + INTERVAL '35 seconds';
    INSERT INTO token_qr(id_entrada, codigo_token, fecha_expiracion, activo)
    VALUES (p_id_entrada, p_codigo, p_expira, TRUE);   -- trigger desactiva el anterior
END;
$$;

-- ---------------------------------------------------------------------
-- 8) LISTAR LAS COMPRAS (VENTAS) DE UN USUARIO
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_compras_usuario(p_id_usuario BIGINT)
RETURNS TABLE (
    id_venta     BIGINT,
    fecha        TIMESTAMPTZ,
    estado       TEXT,
    cant_entradas BIGINT,
    subtotal     NUMERIC,
    monto_comision NUMERIC,
    monto_total  NUMERIC
) LANGUAGE sql AS $$
    SELECT v.id_venta, v.fecha, v.estado::text,
           COUNT(e.id_entrada),
           v.subtotal, v.monto_comision, v.monto_total
      FROM venta v
      LEFT JOIN entrada e ON e.id_venta = v.id_venta AND e.estado <> 'ANULADA'
     WHERE v.id_usuario = p_id_usuario
     GROUP BY v.id_venta, v.fecha, v.estado, v.subtotal, v.monto_comision, v.monto_total
     ORDER BY v.fecha DESC;
$$;

-- =====================================================================
-- FIN PROCEDIMIENTOS
-- =====================================================================
