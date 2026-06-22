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

    // uso tstzrange para detectar solapamiento de horarios
    public boolean hayConflictoDeHorario(Long idEstadio, Timestamp inicio, int duracionMin, Long excluirIdEvento) {
        String sql = """
                SELECT COUNT(*) FROM evento
                WHERE id_estadio = ?
                  AND estado <> 'CANCELADO'
                  AND id_evento <> ?
                  AND tstzrange(fecha_hora_inicio,
                                fecha_hora_inicio + (duracion_minutos * INTERVAL '1 minute'))
                   && tstzrange(?::timestamptz, ?::timestamptz + (?::int * INTERVAL '1 minute'))
                """;
        Integer count = jdbc.queryForObject(sql, Integer.class,
                idEstadio, excluirIdEvento == null ? -1L : excluirIdEvento,
                inicio, inicio, duracionMin);
        return count != null && count > 0;
    }

    public Long insertar(Long idAdmin, Long idEstadio, Long idLocal, Long idVisitante,
                         Timestamp fechaHora, int duracion) {
        return jdbc.queryForObject("""
                INSERT INTO evento (id_estadio, id_seleccion_local, id_seleccion_visitante,
                                    fecha_hora_inicio, duracion_minutos, id_administrador, estado)
                VALUES (?, ?, ?, ?, ?, ?, 'PROGRAMADO') RETURNING id_evento
                """, Long.class, idEstadio, idLocal, idVisitante, fechaHora, duracion, idAdmin);
    }

    public void cancelar(Long idEvento) {
        // el trigger de la BD se encarga de liberar el slot del estadio
        jdbc.update("UPDATE evento SET estado = 'CANCELADO' WHERE id_evento = ?", idEvento);
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
}
