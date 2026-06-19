-- =====================================================================
--  FASE 6 - CONSULTAS SQL AVANZADAS
--  Los parametros se muestran como :param (reemplazar por el valor real).
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) RANKING DE COMPRADORES (entradas adquiridas y monto gastado)
-- ---------------------------------------------------------------------
SELECT u.id_usuario,
       u.nombre || ' ' || u.apellido        AS comprador,
       u.email,
       COUNT(e.id_entrada)                   AS entradas_compradas,
       SUM(e.precio)                         AS gasto_entradas,
       DENSE_RANK() OVER (ORDER BY COUNT(e.id_entrada) DESC) AS ranking
  FROM usuario u
  JOIN venta   v ON v.id_usuario = u.id_usuario
  JOIN entrada e ON e.id_venta = v.id_venta AND e.estado <> 'ANULADA'
 GROUP BY u.id_usuario, u.nombre, u.apellido, u.email
 ORDER BY entradas_compradas DESC, gasto_entradas DESC;

-- ---------------------------------------------------------------------
-- 2) EVENTOS CON MAS VENTAS (con cupo total y % de ocupacion)
--    Se usan subconsultas correlacionadas para evitar el doble conteo
--    que produciria sumar cupos sobre el JOIN con entradas.
-- ---------------------------------------------------------------------
SELECT ev.id_evento,
       sl.nombre || ' vs ' || sv.nombre AS partido,
       est.nombre                       AS estadio,
       ev.fecha_hora_inicio,
       vendidas.entradas_vendidas,
       cupos.cupo_total,
       vendidas.recaudacion,
       ROUND(100.0 * vendidas.entradas_vendidas / NULLIF(cupos.cupo_total,0),2) AS ocupacion_pct
  FROM evento ev
  JOIN seleccion sl ON sl.id_seleccion = ev.id_seleccion_local
  JOIN seleccion sv ON sv.id_seleccion = ev.id_seleccion_visitante
  JOIN estadio   est ON est.id_estadio = ev.id_estadio
  JOIN LATERAL (
        SELECT COUNT(e.id_entrada) AS entradas_vendidas,
               COALESCE(SUM(e.precio),0) AS recaudacion
          FROM evento_sector es
          LEFT JOIN entrada e ON e.id_evento_sector = es.id_evento_sector AND e.estado <> 'ANULADA'
         WHERE es.id_evento = ev.id_evento
       ) vendidas ON TRUE
  JOIN LATERAL (
        SELECT COALESCE(SUM(es.cupo_habilitado),0) AS cupo_total
          FROM evento_sector es WHERE es.id_evento = ev.id_evento
       ) cupos ON TRUE
 ORDER BY vendidas.entradas_vendidas DESC;

-- ---------------------------------------------------------------------
-- 3) HISTORIAL COMPLETO DE UNA ENTRADA (cadena de custodia)
--    Emision -> transferencias aceptadas -> validacion final.
-- ---------------------------------------------------------------------
WITH eventos_entrada AS (
    -- Emision
    SELECT e.id_entrada,
           1 AS orden,
           e.fecha_emision AS fecha,
           'EMISION'::text AS evento,
           NULL::bigint AS usuario_origen,
           cmp.id_usuario AS usuario_destino
      FROM entrada e
      JOIN venta v ON v.id_venta = e.id_venta
      JOIN usuario cmp ON cmp.id_usuario = v.id_usuario
     WHERE e.id_entrada = 1   -- reemplazar con el id_entrada deseado
    UNION ALL
    -- Transferencias aceptadas
    SELECT t.id_entrada,
           2 AS orden,
           t.fecha_aceptacion,
           'TRANSFERENCIA'::text,
           t.id_usuario_origen,
           t.id_usuario_destino
      FROM transferencia t
     WHERE t.id_entrada = 1 AND t.estado = 'ACEPTADA'   -- mismo id_entrada
    UNION ALL
    -- Validacion / consumo
    SELECT val.id_entrada,
           3 AS orden,
           val.fecha_hora,
           'VALIDACION'::text,
           val.id_funcionario,
           NULL
      FROM validacion val
     WHERE val.id_entrada = 1   -- mismo id_entrada
)
SELECT ee.evento,
       ee.fecha,
       uo.nombre AS desde,
       ud.nombre AS hacia
  FROM eventos_entrada ee
  LEFT JOIN usuario uo ON uo.id_usuario = ee.usuario_origen
  LEFT JOIN usuario ud ON ud.id_usuario = ee.usuario_destino
 ORDER BY ee.fecha, ee.orden;

-- ---------------------------------------------------------------------
-- 4) ENTRADAS QUE UN USUARIO TIENE ASIGNADAS ACTUALMENTE
-- ---------------------------------------------------------------------
SELECT e.id_entrada,
       e.codigo_unico,
       sl.nombre || ' vs ' || sv.nombre AS partido,
       est.nombre  AS estadio,
       s.nombre_sector AS sector,
       ev.fecha_hora_inicio,
       e.estado,
       e.precio
  FROM entrada e
  JOIN evento_sector es ON es.id_evento_sector = e.id_evento_sector
  JOIN evento ev ON ev.id_evento = es.id_evento
  JOIN sector s  ON s.id_sector  = es.id_sector
  JOIN estadio est ON est.id_estadio = ev.id_estadio
  JOIN seleccion sl ON sl.id_seleccion = ev.id_seleccion_local
  JOIN seleccion sv ON sv.id_seleccion = ev.id_seleccion_visitante
 WHERE e.id_usuario_actual = 1   -- reemplazar con el id_usuario deseado
   AND e.estado IN ('EMITIDA','TRANSFERIDA')
 ORDER BY ev.fecha_hora_inicio;

-- ---------------------------------------------------------------------
-- 5) TRANSFERENCIAS REALIZADAS POR UN USUARIO (enviadas y recibidas)
-- ---------------------------------------------------------------------
SELECT t.id_transferencia,
       t.id_entrada,
       CASE WHEN t.id_usuario_origen = 1 THEN 'ENVIADA' ELSE 'RECIBIDA' END AS rol,   -- reemplazar con el id_usuario deseado
       uo.nombre AS origen,
       ud.nombre AS destino,
       t.estado,
       t.fecha_transferencia,
       t.fecha_aceptacion
  FROM transferencia t
  JOIN usuario uo ON uo.id_usuario = t.id_usuario_origen
  JOIN usuario ud ON ud.id_usuario = t.id_usuario_destino
 WHERE t.id_usuario_origen = 1   -- mismo id_usuario
    OR t.id_usuario_destino = 1
 ORDER BY t.fecha_transferencia DESC;

-- ---------------------------------------------------------------------
-- 6) ESTADISTICAS POR ESTADIO (eventos, ventas, recaudacion, ocupacion)
-- ---------------------------------------------------------------------
WITH cupos AS (
    SELECT ev.id_estadio,
           COUNT(DISTINCT ev.id_evento) AS eventos,
           SUM(es.cupo_habilitado)      AS cupo_total
      FROM evento ev
      JOIN evento_sector es ON es.id_evento = ev.id_evento
     GROUP BY ev.id_estadio
),
ventas AS (
    SELECT ev.id_estadio,
           COUNT(e.id_entrada)  AS entradas,
           SUM(e.precio)        AS recaudacion
      FROM evento ev
      JOIN evento_sector es ON es.id_evento = ev.id_evento
      JOIN entrada e ON e.id_evento_sector = es.id_evento_sector AND e.estado <> 'ANULADA'
     GROUP BY ev.id_estadio
)
SELECT est.id_estadio,
       est.nombre AS estadio,
       p.nombre   AS pais,
       COALESCE(c.eventos,0)      AS eventos,
       COALESCE(c.cupo_total,0)   AS cupo_total,
       COALESCE(v.entradas,0)     AS entradas_vendidas,
       COALESCE(v.recaudacion,0)  AS recaudacion,
       ROUND(100.0 * COALESCE(v.entradas,0) / NULLIF(c.cupo_total,0),2) AS ocupacion_pct
  FROM estadio est
  JOIN pais p ON p.id_pais = est.id_pais
  LEFT JOIN cupos  c ON c.id_estadio = est.id_estadio
  LEFT JOIN ventas v ON v.id_estadio = est.id_estadio
 ORDER BY recaudacion DESC NULLS LAST;

-- =====================================================================
-- FIN CONSULTAS
-- =====================================================================
