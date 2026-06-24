package uy.edu.ucu.ticketing.repository;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.sql.Timestamp;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Repository
public class EventoRepository {

    private final JdbcTemplate jdbc;

    public EventoRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    // saco el pais via el estadio del evento
    public Optional<Integer> paisDelEvento(Long idEvento) {
        List<Map<String, Object>> rows = jdbc.queryForList("""
                SELECT est.id_pais
                FROM evento ev JOIN estadio est ON est.id_estadio = ev.id_estadio
                WHERE ev.id_evento = ?
                """, idEvento);
        return rows.isEmpty() ? Optional.empty()
                : Optional.of(((Number) rows.get(0).get("id_pais")).intValue());
    }

    public Long insertar(Long idAdmin, Long idEstadio, Long idLocal, Long idVisitante,
                         Timestamp fechaHora, int duracion) {
        return jdbc.queryForObject(
                "SELECT fn_crear_evento_wrapper(?, ?, ?, ?, ?, ?)",
                Long.class, idAdmin, idEstadio, idLocal, idVisitante, fechaHora, duracion);
    }

    public void cancelar(Long idAdmin, Long idEvento) {
        jdbc.update("CALL sp_cancelar_evento(?, ?)", idAdmin, idEvento);
    }

    public List<Map<String, Object>> disponibles() {
        return jdbc.queryForList("""
                SELECT ev.id_evento, ev.id_estadio,
                       sl.nombre AS local, sv.nombre AS visitante,
                       est.nombre AS estadio,
                       to_char(ev.fecha_hora_inicio, 'YYYY-MM-DD HH24:MI') AS fecha,
                       ev.estado::text
                FROM evento ev
                JOIN seleccion sl  ON sl.id_seleccion = ev.id_seleccion_local
                JOIN seleccion sv  ON sv.id_seleccion = ev.id_seleccion_visitante
                JOIN estadio   est ON est.id_estadio  = ev.id_estadio
                WHERE ev.estado = 'PROGRAMADO'
                ORDER BY ev.fecha_hora_inicio
                """);
    }

    public List<Map<String, Object>> todos() {
        return jdbc.queryForList("""
                SELECT ev.id_evento  AS "idEvento",
                       ev.id_estadio AS "idEstadio",
                       sl.nombre     AS local,
                       sv.nombre     AS visitante,
                       est.nombre    AS estadio,
                       to_char(ev.fecha_hora_inicio, 'YYYY-MM-DD HH24:MI') AS fecha,
                       ev.estado::text AS estado
                FROM evento ev
                JOIN seleccion sl  ON sl.id_seleccion = ev.id_seleccion_local
                JOIN seleccion sv  ON sv.id_seleccion = ev.id_seleccion_visitante
                JOIN estadio   est ON est.id_estadio  = ev.id_estadio
                ORDER BY ev.fecha_hora_inicio DESC
                """);
    }
}
