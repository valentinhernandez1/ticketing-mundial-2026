-- Triggers del sistema de ticketing
-- Requiere 01_ddl.sql ejecutado antes

-- comision: antes de insertar una venta busco la tasa vigente y la guardo
CREATE OR REPLACE FUNCTION fn_venta_before_insert()
RETURNS TRIGGER AS $$
DECLARE
    v_id_comision BIGINT;
    v_pct         NUMERIC(5,2);
BEGIN
    SELECT c.id_comision, c.porcentaje
      INTO v_id_comision, v_pct
      FROM comision c
     WHERE c.fecha_inicio <= NEW.fecha::date
       AND (c.fecha_fin IS NULL OR c.fecha_fin >= NEW.fecha::date)
     ORDER BY c.fecha_inicio DESC
     LIMIT 1;

    IF v_id_comision IS NULL THEN
        RAISE EXCEPTION 'No existe una tasa de comision vigente para la fecha %', NEW.fecha;
    END IF;

    NEW.id_comision         := v_id_comision;
    NEW.porcentaje_aplicado := v_pct;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_venta_before_insert
    BEFORE INSERT ON venta
    FOR EACH ROW EXECUTE FUNCTION fn_venta_before_insert();

-- entrada: maximo 5 por compra, control de aforo y precio desde el sector
CREATE OR REPLACE FUNCTION fn_entrada_before_insert()
RETURNS TRIGGER AS $$
DECLARE
    v_comprador     BIGINT;
    v_cant_compra   INT;
    v_precio_es     NUMERIC(12,2);
    v_cupo          INT;
    v_cap_max       INT;
    v_vendidas      INT;
BEGIN
    -- Titular inicial = comprador de la venta
    SELECT v.id_usuario INTO v_comprador FROM venta v WHERE v.id_venta = NEW.id_venta;
    IF NEW.id_usuario_actual IS NULL THEN
        NEW.id_usuario_actual := v_comprador;
    END IF;

    -- Precio y cupo desde evento_sector.
    -- FOR UPDATE serializa compras concurrentes al mismo sector:
    -- dos transacciones en paralelo leen el mismo cupo, solo una
    -- puede hacer el INSERT; la otra espera y relanza si hay sobreaforo.
    SELECT es.precio, es.cupo_habilitado, s.capacidad_maxima
      INTO v_precio_es, v_cupo, v_cap_max
      FROM evento_sector es
      JOIN sector s ON s.id_sector = es.id_sector
     WHERE es.id_evento_sector = NEW.id_evento_sector
     FOR UPDATE OF es;

    IF NEW.precio IS NULL THEN
        NEW.precio := v_precio_es;
    END IF;

    -- REGLA: maximo 5 entradas por compra
    SELECT COUNT(*) INTO v_cant_compra FROM entrada e WHERE e.id_venta = NEW.id_venta;
    IF v_cant_compra >= 5 THEN
        RAISE EXCEPTION 'Limite excedido: una compra no puede tener mas de 5 entradas (venta %)', NEW.id_venta;
    END IF;

    -- REGLA: control de sobreaforo (cupo del evento y capacidad del sector)
    SELECT COUNT(*) INTO v_vendidas
      FROM entrada e
     WHERE e.id_evento_sector = NEW.id_evento_sector
       AND e.estado <> 'ANULADA';
    IF v_vendidas + 1 > LEAST(v_cupo, v_cap_max) THEN
        RAISE EXCEPTION 'Sobreaforo: cupo habilitado (%) agotado para el sector del evento', LEAST(v_cupo, v_cap_max);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_entrada_before_insert
    BEFORE INSERT ON entrada
    FOR EACH ROW EXECUTE FUNCTION fn_entrada_before_insert();

-- recalculo el total de la venta cada vez que se agrega/modifica una entrada
CREATE OR REPLACE FUNCTION fn_recalcular_venta()
RETURNS TRIGGER AS $$
DECLARE
    v_venta   BIGINT;
    v_sub     NUMERIC(14,2);
    v_pct     NUMERIC(5,2);
BEGIN
    v_venta := COALESCE(NEW.id_venta, OLD.id_venta);

    SELECT COALESCE(SUM(precio),0) INTO v_sub
      FROM entrada WHERE id_venta = v_venta AND estado <> 'ANULADA';

    SELECT porcentaje_aplicado INTO v_pct FROM venta WHERE id_venta = v_venta;

    UPDATE venta
       SET subtotal       = v_sub,
           monto_comision = ROUND(v_sub * v_pct / 100.0, 2),
           monto_total    = v_sub + ROUND(v_sub * v_pct / 100.0, 2)
     WHERE id_venta = v_venta;

    RETURN NULL;  -- AFTER trigger
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_recalc_venta
    AFTER INSERT OR UPDATE OR DELETE ON entrada
    FOR EACH ROW EXECUTE FUNCTION fn_recalcular_venta();

-- evento: no puede haber dos partidos solapados en el mismo estadio
CREATE OR REPLACE FUNCTION fn_evento_no_superpuesto()
RETURNS TRIGGER AS $$
DECLARE
    v_existe INT;
    v_periodo tstzrange;
BEGIN
    v_periodo := tstzrange(NEW.fecha_hora_inicio,
                           NEW.fecha_hora_inicio + make_interval(mins => NEW.duracion_minutos));
    SELECT COUNT(*) INTO v_existe
      FROM evento e
     WHERE e.id_estadio = NEW.id_estadio
       AND e.id_evento <> COALESCE(NEW.id_evento, -1)
       AND e.estado <> 'CANCELADO'
       AND e.periodo && v_periodo;
    IF v_existe > 0 THEN
        RAISE EXCEPTION 'Conflicto de agenda: ya existe un evento solapado en el estadio % en ese horario', NEW.id_estadio;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_evento_no_superpuesto
    BEFORE INSERT OR UPDATE ON evento
    FOR EACH ROW EXECUTE FUNCTION fn_evento_no_superpuesto();

-- Al cancelar un evento:
--   1. Libera la franja temporal (NULL no participa en el indice GiST).
--   2. Anula las entradas no consumidas (estado EMITIDA o TRANSFERIDA).
--   3. Desactiva los tokens QR activos de esas entradas.
CREATE OR REPLACE FUNCTION fn_evento_cancelar()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    IF TG_OP = 'UPDATE' AND NEW.estado = 'CANCELADO' AND OLD.estado <> 'CANCELADO' THEN
        NEW.periodo := NULL;

        -- Anular entradas no consumidas del evento cancelado
        UPDATE entrada SET estado = 'ANULADA'
         WHERE id_evento_sector IN (
                 SELECT id_evento_sector FROM evento_sector WHERE id_evento = NEW.id_evento
               )
           AND estado NOT IN ('CONSUMIDA', 'ANULADA');

        -- Desactivar tokens QR de las entradas anuladas
        UPDATE token_qr SET activo = FALSE
         WHERE id_entrada IN (
                 SELECT e.id_entrada
                   FROM entrada e
                   JOIN evento_sector es ON es.id_evento_sector = e.id_evento_sector
                  WHERE es.id_evento = NEW.id_evento
               )
           AND activo = TRUE;

        -- Anular las ventas cuyos TODOS los items quedaron anulados por este evento
        -- (una venta puede tener entradas de distintos eventos; solo anulamos si todas quedaron anuladas)
        UPDATE venta SET estado = 'ANULADA'
         WHERE id_venta IN (
                 SELECT DISTINCT e.id_venta
                   FROM entrada e
                   JOIN evento_sector es ON es.id_evento_sector = e.id_evento_sector
                  WHERE es.id_evento = NEW.id_evento
               )
           AND NOT EXISTS (
                 SELECT 1 FROM entrada e2
                  WHERE e2.id_venta = venta.id_venta
                    AND e2.estado <> 'ANULADA'
               );
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_evento_cancelar
    BEFORE UPDATE OF estado ON evento
    FOR EACH ROW EXECUTE FUNCTION fn_evento_cancelar();

-- transferencia: valida titular, maximo 3, y audita cada cambio de estado
CREATE OR REPLACE FUNCTION fn_transferencia_before()
RETURNS TRIGGER AS $$
DECLARE
    v_estado_entrada dom_estado_entrada;
    v_titular        BIGINT;
    v_cant           INT;
BEGIN
    IF TG_OP = 'INSERT' THEN
        SELECT estado, id_usuario_actual, cantidad_transferencias
          INTO v_estado_entrada, v_titular, v_cant
          FROM entrada WHERE id_entrada = NEW.id_entrada FOR UPDATE;

        IF v_estado_entrada = 'CONSUMIDA' THEN
            RAISE EXCEPTION 'La entrada % ya fue consumida y no puede transferirse', NEW.id_entrada;
        END IF;

        -- REGLA: maximo 3 transferencias antes de la validacion
        IF v_cant >= 3 THEN
            RAISE EXCEPTION 'Limite excedido: la entrada % ya alcanzo 3 transferencias', NEW.id_entrada;
        END IF;

        -- El origen debe ser el titular actual
        IF NEW.id_usuario_origen <> v_titular THEN
            RAISE EXCEPTION 'Solo el titular actual (usuario %) puede transferir la entrada %', v_titular, NEW.id_entrada;
        END IF;

        -- No puede haber otra transferencia pendiente sobre la misma entrada
        IF EXISTS (SELECT 1 FROM transferencia
                    WHERE id_entrada = NEW.id_entrada AND estado = 'PENDIENTE') THEN
            RAISE EXCEPTION 'Ya existe una transferencia pendiente para la entrada %', NEW.id_entrada;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_transferencia_before
    BEFORE INSERT ON transferencia
    FOR EACH ROW EXECUTE FUNCTION fn_transferencia_before();

-- Al aceptar: cambia titular, restaura estado a EMITIDA e incrementa contador.
-- El estado 'TRANSFERIDA' solo aplica mientras la transferencia está PENDIENTE.
-- Una vez aceptada, la entrada pasa a 'EMITIDA' para el nuevo titular.
CREATE OR REPLACE FUNCTION fn_transferencia_aceptar()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' AND OLD.estado = 'PENDIENTE' AND NEW.estado = 'ACEPTADA' THEN
        IF NEW.fecha_aceptacion IS NULL THEN
            NEW.fecha_aceptacion := now();
        END IF;
        UPDATE entrada
           SET id_usuario_actual = NEW.id_usuario_destino,
               estado = 'EMITIDA',
               cantidad_transferencias = cantidad_transferencias + 1
         WHERE id_entrada = NEW.id_entrada;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_transferencia_aceptar
    BEFORE UPDATE ON transferencia
    FOR EACH ROW EXECUTE FUNCTION fn_transferencia_aceptar();

-- Auditoria de transferencias (INSERT y cambios de estado)
CREATE OR REPLACE FUNCTION fn_auditar_transferencia()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO auditoria_transferencia(id_transferencia,id_entrada,id_usuario_origen,
               id_usuario_destino,estado_anterior,estado_nuevo,accion)
        VALUES (NEW.id_transferencia,NEW.id_entrada,NEW.id_usuario_origen,
               NEW.id_usuario_destino,NULL,NEW.estado,'ALTA');
    ELSIF TG_OP = 'UPDATE' AND OLD.estado IS DISTINCT FROM NEW.estado THEN
        INSERT INTO auditoria_transferencia(id_transferencia,id_entrada,id_usuario_origen,
               id_usuario_destino,estado_anterior,estado_nuevo,accion)
        VALUES (NEW.id_transferencia,NEW.id_entrada,NEW.id_usuario_origen,
               NEW.id_usuario_destino,OLD.estado,NEW.estado,'CAMBIO_ESTADO');
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_auditar_transferencia
    AFTER INSERT OR UPDATE ON transferencia
    FOR EACH ROW EXECUTE FUNCTION fn_auditar_transferencia();

-- validacion: verifica token, dispositivo y asignacion del funcionario
CREATE OR REPLACE FUNCTION fn_validacion_before()
RETURNS TRIGGER AS $$
DECLARE
    v_estado    dom_estado_entrada;
    v_es        BIGINT;
    v_evento    BIGINT;
    v_sector    BIGINT;
    v_disp_func BIGINT;
    v_disp_est  VARCHAR(12);
    v_tok_ent   BIGINT;
    v_tok_act   BOOLEAN;
    v_tok_exp   TIMESTAMPTZ;
BEGIN
    -- Los registros RECHAZADO se insertan desde el handler de excepcion de
    -- sp_validar_acceso para auditar intentos fallidos. No requieren revalidacion.
    IF NEW.resultado = 'RECHAZADO' THEN
        RETURN NEW;
    END IF;

    -- Entrada disponible (ni consumida, ni anulada, ni en transferencia pendiente)
    SELECT estado, id_evento_sector INTO v_estado, v_es
      FROM entrada WHERE id_entrada = NEW.id_entrada FOR UPDATE;
    IF v_estado IS NULL THEN
        RAISE EXCEPTION 'Entrada % inexistente', NEW.id_entrada;
    END IF;
    IF v_estado = 'CONSUMIDA' THEN
        RAISE EXCEPTION 'La entrada % ya fue consumida', NEW.id_entrada;
    END IF;
    IF v_estado = 'ANULADA' THEN
        RAISE EXCEPTION 'La entrada % fue anulada (el evento fue cancelado)', NEW.id_entrada;
    END IF;
    -- BUG FIX: bloquear validación mientras hay una transferencia pendiente
    IF v_estado = 'TRANSFERIDA' THEN
        RAISE EXCEPTION 'La entrada % tiene una transferencia pendiente y no puede validarse', NEW.id_entrada;
    END IF;

    -- Token debe pertenecer a la entrada, estar activo y vigente
    SELECT id_entrada, activo, fecha_expiracion INTO v_tok_ent, v_tok_act, v_tok_exp
      FROM token_qr WHERE id_token = NEW.id_token;
    IF v_tok_ent IS DISTINCT FROM NEW.id_entrada THEN
        RAISE EXCEPTION 'El token no corresponde a la entrada %', NEW.id_entrada;
    END IF;
    IF NOT v_tok_act OR v_tok_exp < NEW.fecha_hora THEN
        RAISE EXCEPTION 'El token QR no esta activo o esta vencido';
    END IF;

    -- Dispositivo activo y perteneciente al funcionario que valida
    SELECT id_funcionario, estado INTO v_disp_func, v_disp_est
      FROM dispositivo WHERE id_dispositivo = NEW.id_dispositivo;
    IF v_disp_func IS DISTINCT FROM NEW.id_funcionario THEN
        RAISE EXCEPTION 'El dispositivo % no pertenece al funcionario %', NEW.id_dispositivo, NEW.id_funcionario;
    END IF;
    IF v_disp_est <> 'ACTIVO' THEN
        RAISE EXCEPTION 'El dispositivo % no esta activo', NEW.id_dispositivo;
    END IF;

    -- Funcionario debe estar asignado al sector/evento de la entrada
    SELECT es.id_evento, es.id_sector INTO v_evento, v_sector
      FROM evento_sector es WHERE es.id_evento_sector = v_es;
    IF NOT EXISTS (SELECT 1 FROM asignacion_funcionario_sector a
                    WHERE a.id_funcionario = NEW.id_funcionario
                      AND a.id_evento = v_evento
                      AND a.id_sector = v_sector) THEN
        RAISE EXCEPTION 'El funcionario % no esta asignado al sector de la entrada', NEW.id_funcionario;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_validacion_before
    BEFORE INSERT ON validacion
    FOR EACH ROW EXECUTE FUNCTION fn_validacion_before();

-- Marcar entrada CONSUMIDA y desactivar tokens (consumo irreversible)
CREATE OR REPLACE FUNCTION fn_validacion_after()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.resultado = 'ACEPTADO' THEN
        UPDATE entrada SET estado = 'CONSUMIDA' WHERE id_entrada = NEW.id_entrada;
        UPDATE token_qr SET activo = FALSE WHERE id_entrada = NEW.id_entrada AND activo = TRUE;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_validacion_after
    AFTER INSERT ON validacion
    FOR EACH ROW EXECUTE FUNCTION fn_validacion_after();

-- token QR: solo puede haber uno activo por entrada a la vez
CREATE OR REPLACE FUNCTION fn_token_unico_activo()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.activo THEN
        UPDATE token_qr SET activo = FALSE
         WHERE id_entrada = NEW.id_entrada AND activo = TRUE AND id_token <> NEW.id_token;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_token_unico_activo
    BEFORE INSERT ON token_qr
    FOR EACH ROW EXECUTE FUNCTION fn_token_unico_activo();

