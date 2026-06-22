package uy.edu.ucu.ticketing.repository;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Repository
public class EventoSectorRepository {

    private final JdbcTemplate jdbc;

    public EventoSectorRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    // disponibilidad y precio del sector para validar antes de comprar
    public Optional<Map<String, Object>> findById(Long idEventoSector) {
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

    public Long insertar(Long idEvento, Long idSector, Integer cupo, BigDecimal precio) {
        return jdbc.queryForObject("""
                INSERT INTO evento_sector (id_evento, id_sector, cupo_habilitado, precio)
                VALUES (?, ?, ?, ?) RETURNING id_evento_sector
                """, Long.class, idEvento, idSector, cupo, precio);
    }

    public List<Map<String, Object>> sectoresPorEvento(Long idEvento) {
        return jdbc.queryForList("""
                SELECT es.id_evento_sector,
                       s.nombre_sector::text AS sector,
                       es.precio,
                       es.cupo_habilitado,
                       (SELECT COUNT(*) FROM entrada en
                         WHERE en.id_evento_sector = es.id_evento_sector
                           AND en.estado <> 'ANULADA') AS vendidas
                FROM evento_sector es
                JOIN sector s ON s.id_sector = es.id_sector
                WHERE es.id_evento = ?
                ORDER BY s.nombre_sector
                """, idEvento);
    }
}
