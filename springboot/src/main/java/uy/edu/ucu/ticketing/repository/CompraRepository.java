package uy.edu.ucu.ticketing.repository;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Repository
public class CompraRepository {

    private final JdbcTemplate jdbc;

    public CompraRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public Optional<Map<String, Object>> comisionVigente() {
        List<Map<String, Object>> rows = jdbc.queryForList("""
                SELECT id_comision, porcentaje
                FROM comision
                WHERE fecha_inicio <= CURRENT_DATE
                  AND (fecha_fin IS NULL OR fecha_fin >= CURRENT_DATE)
                ORDER BY fecha_inicio DESC
                LIMIT 1
                """);
        return rows.isEmpty() ? Optional.empty() : Optional.of(rows.get(0));
    }

    // disponibilidad y precio del sector
    public Optional<Map<String, Object>> findEventoSector(Long idEventoSector) {
        List<Map<String, Object>> rows = jdbc.queryForList("""
                SELECT es.id_evento_sector, es.cupo_habilitado, es.precio,
                       (SELECT COUNT(*) FROM entrada e
                        WHERE e.id_evento_sector = es.id_evento_sector
                          AND e.estado <> 'ANULADA') AS vendidas
                FROM evento_sector es
                WHERE es.id_evento_sector = ?
                """, idEventoSector);
        return rows.isEmpty() ? Optional.empty() : Optional.of(rows.get(0));
    }

    public Long insertarVenta(Long idUsuario, Long idComision, BigDecimal porcentaje,
                               BigDecimal subtotal, BigDecimal montoComision, BigDecimal total) {
        return jdbc.queryForObject("""
                INSERT INTO venta (id_usuario, estado, id_comision, porcentaje_aplicado,
                                   subtotal, monto_comision, monto_total)
                VALUES (?, 'PENDIENTE', ?, ?, ?, ?, ?)
                RETURNING id_venta
                """, Long.class, idUsuario, idComision, porcentaje, subtotal, montoComision, total);
    }

    public Long insertarEntrada(Long idVenta, Long idEventoSector, Long idUsuario, BigDecimal precio) {
        return jdbc.queryForObject("""
                INSERT INTO entrada (id_venta, id_evento_sector, id_usuario_actual, estado, precio)
                VALUES (?, ?, ?, 'EMITIDA', ?)
                RETURNING id_entrada
                """, Long.class, idVenta, idEventoSector, idUsuario, precio);
    }

    public List<Map<String, Object>> comprasDeUsuario(Long idUsuario) {
        return jdbc.queryForList("""
                SELECT v.id_venta          AS "idVenta",
                       v.fecha             AS "fecha",
                       v.estado::text      AS "estado",
                       v.subtotal          AS "subtotal",
                       v.porcentaje_aplicado AS "porcentaje",
                       v.monto_comision    AS "comision",
                       v.monto_total       AS "total",
                       COUNT(e.id_entrada) AS "cantEntradas"
                FROM venta v
                LEFT JOIN entrada e ON e.id_venta = v.id_venta AND e.estado <> 'ANULADA'
                WHERE v.id_usuario = ?
                GROUP BY v.id_venta, v.fecha, v.estado, v.subtotal,
                         v.porcentaje_aplicado, v.monto_comision, v.monto_total
                ORDER BY v.fecha DESC
                """, idUsuario);
    }

    public void marcarPaga(Long idVenta) {
        jdbc.update("UPDATE venta SET estado = 'PAGA' WHERE id_venta = ?", idVenta);
    }

    // necesito el dueño y el estado actual para validar la transición
    public Optional<Map<String, Object>> findVenta(Long idVenta) {
        List<Map<String, Object>> rows = jdbc.queryForList(
                "SELECT id_usuario, estado::text FROM venta WHERE id_venta = ?", idVenta);
        return rows.isEmpty() ? Optional.empty() : Optional.of(rows.get(0));
    }

    public void confirmarVenta(Long idVenta) {
        jdbc.update("UPDATE venta SET estado = 'CONFIRMADA' WHERE id_venta = ?", idVenta);
    }
}
