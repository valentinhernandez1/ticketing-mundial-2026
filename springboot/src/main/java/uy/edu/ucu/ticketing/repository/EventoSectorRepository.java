package uy.edu.ucu.ticketing.repository;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;


import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Repository
public class EventoSectorRepository {

    private final JdbcTemplate jdbc;

    public EventoSectorRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public Long insertar(Long idAdmin, Long idEvento, Long idSector, Integer cupo, BigDecimal precio) {
        return jdbc.queryForObject(
                "SELECT fn_habilitar_sector_wrapper(?, ?, ?, ?, ?)",
                Long.class, idAdmin, idEvento, idSector, cupo, precio);
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
