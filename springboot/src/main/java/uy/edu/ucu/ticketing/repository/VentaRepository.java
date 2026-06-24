package uy.edu.ucu.ticketing.repository;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;
import uy.edu.ucu.ticketing.model.Venta;
import uy.edu.ucu.ticketing.model.enums.EstadoVenta;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@Repository
public class VentaRepository {

    private final JdbcTemplate jdbc;

    public VentaRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public Optional<Venta> findById(Long idVenta) {
        List<Venta> rows = jdbc.query(
                "SELECT id_venta, id_usuario, estado::text AS estado FROM venta WHERE id_venta = ?",
                (rs, i) -> {
                    Venta v = new Venta();
                    v.setId(rs.getLong("id_venta"));
                    v.setIdUsuario(rs.getLong("id_usuario"));
                    v.setEstado(EstadoVenta.valueOf(rs.getString("estado")));
                    return v;
                }, idVenta);
        return rows.isEmpty() ? Optional.empty() : Optional.of(rows.get(0));
    }

    public void confirmar(Long idVenta) {
        jdbc.update("UPDATE venta SET estado = 'CONFIRMADA' WHERE id_venta = ?", idVenta);
    }

    public void marcarPaga(Long idVenta) {
        jdbc.update("UPDATE venta SET estado = 'PAGA' WHERE id_venta = ?", idVenta);
    }

    public List<Map<String, Object>> porUsuario(Long idUsuario) {
        // Query 1: resumen de ventas
        List<Map<String, Object>> ventas = jdbc.queryForList("""
                SELECT v.id_venta            AS "idVenta",
                       v.fecha               AS "fecha",
                       v.estado::text        AS "estado",
                       v.subtotal            AS "subtotal",
                       v.porcentaje_aplicado AS "porcentaje",
                       v.monto_comision      AS "comision",
                       v.monto_total         AS "total",
                       COUNT(e.id_entrada)   AS "cantEntradas"
                FROM venta v
                LEFT JOIN entrada e ON e.id_venta = v.id_venta AND e.estado <> 'ANULADA'
                WHERE v.id_usuario = ?
                GROUP BY v.id_venta, v.fecha, v.estado, v.subtotal,
                         v.porcentaje_aplicado, v.monto_comision, v.monto_total
                ORDER BY v.fecha DESC
                """, idUsuario);

        // Query 2: detalle de entradas por venta (evita JSON_AGG → PGobject serialization issue)
        ventas.forEach(venta -> {
            Long idVenta = ((Number) venta.get("idVenta")).longValue();
            List<Map<String, Object>> entradas = jdbc.queryForList("""
                    SELECT e.id_entrada                   AS "idEntrada",
                           sl.nombre                     AS "seleccionLocal",
                           sv.nombre                     AS "seleccionVisitante",
                           s.nombre_sector::text         AS "nombreSector",
                           est.nombre                    AS "estadio",
                           e.estado::text                AS "estado"
                    FROM entrada       e
                    JOIN evento_sector es  ON es.id_evento_sector = e.id_evento_sector
                    JOIN evento        ev  ON ev.id_evento        = es.id_evento
                    JOIN sector        s   ON s.id_sector         = es.id_sector
                    JOIN estadio       est ON est.id_estadio      = ev.id_estadio
                    JOIN seleccion     sl  ON sl.id_seleccion     = ev.id_seleccion_local
                    JOIN seleccion     sv  ON sv.id_seleccion     = ev.id_seleccion_visitante
                    WHERE e.id_venta = ? AND e.estado <> 'ANULADA'
                    ORDER BY e.id_entrada
                    """, idVenta);
            venta.put("entradas", entradas);
        });

        return ventas;
    }
}
