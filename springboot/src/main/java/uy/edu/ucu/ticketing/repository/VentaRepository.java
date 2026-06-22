package uy.edu.ucu.ticketing.repository;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Repository
public class VentaRepository {

    private final JdbcTemplate jdbc;

    public VentaRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public Long insertar(Long idUsuario, Long idComision, BigDecimal porcentaje,
                         BigDecimal subtotal, BigDecimal montoComision, BigDecimal montoTotal) {
        return jdbc.queryForObject("""
                INSERT INTO venta (id_usuario, estado, id_comision, porcentaje_aplicado,
                                   subtotal, monto_comision, monto_total)
                VALUES (?, 'PENDIENTE', ?, ?, ?, ?, ?)
                RETURNING id_venta
                """, Long.class, idUsuario, idComision, porcentaje, subtotal, montoComision, montoTotal);
    }

    // necesito el dueño y el estado actual para validar la transición
    public Optional<Map<String, Object>> findById(Long idVenta) {
        List<Map<String, Object>> rows = jdbc.queryForList(
                "SELECT id_usuario, estado::text FROM venta WHERE id_venta = ?", idVenta);
        return rows.isEmpty() ? Optional.empty() : Optional.of(rows.get(0));
    }

    public void confirmar(Long idVenta) {
        jdbc.update("UPDATE venta SET estado = 'CONFIRMADA' WHERE id_venta = ?", idVenta);
    }

    public void marcarPaga(Long idVenta) {
        jdbc.update("UPDATE venta SET estado = 'PAGA' WHERE id_venta = ?", idVenta);
    }

    public List<Map<String, Object>> porUsuario(Long idUsuario) {
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
}
