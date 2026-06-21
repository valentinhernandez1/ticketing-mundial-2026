package uy.edu.ucu.ticketing.repository;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.sql.Timestamp;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Repository
public class AdminRepository {

    private final JdbcTemplate jdbc;

    public AdminRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    // necesito el pais del admin para saber si tiene jurisdiccion
    public Optional<Integer> paisDelAdmin(Long idAdmin) {
        List<Map<String, Object>> rows = jdbc.queryForList(
                "SELECT id_pais FROM administrador_pais WHERE id_usuario = ?", idAdmin);
        return rows.isEmpty() ? Optional.empty()
                : Optional.of(((Number) rows.get(0).get("id_pais")).intValue());
    }

    public Optional<Map<String, Object>> findEstadio(Long idEstadio) {
        List<Map<String, Object>> rows = jdbc.queryForList(
                "SELECT id_estadio, id_pais, nombre FROM estadio WHERE id_estadio = ?", idEstadio);
        return rows.isEmpty() ? Optional.empty() : Optional.of(rows.get(0));
    }

    // lo saco via el estadio
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

    public Optional<Integer> capacidadSector(Long idSector) {
        List<Map<String, Object>> rows = jdbc.queryForList(
                "SELECT capacidad_maxima FROM sector WHERE id_sector = ?", idSector);
        return rows.isEmpty() ? Optional.empty()
                : Optional.of(((Number) rows.get(0).get("capacidad_maxima")).intValue());
    }

    public Long insertarEstadio(String nombre, Integer idPais, String ciudad, String direccion) {
        return jdbc.queryForObject("""
                INSERT INTO estadio (nombre, id_pais, ciudad, direccion)
                VALUES (?, ?, ?, ?) RETURNING id_estadio
                """, Long.class, nombre, idPais, ciudad, direccion);
    }

    public Long insertarSector(Long idEstadio, String nombre, Integer capacidad, BigDecimal precio) {
        return jdbc.queryForObject("""
                INSERT INTO sector (id_estadio, nombre_sector, capacidad_maxima, precio_base)
                VALUES (?, ?, ?, ?) RETURNING id_sector
                """, Long.class, idEstadio, nombre, capacidad, precio);
    }

    public Long insertarEvento(Long idAdmin, Long idEstadio, Long idLocal, Long idVisitante,
                                Timestamp fechaHora, int duracion) {
        return jdbc.queryForObject("""
                INSERT INTO evento (id_estadio, id_seleccion_local, id_seleccion_visitante,
                                    fecha_hora_inicio, duracion_minutos, id_administrador, estado)
                VALUES (?, ?, ?, ?, ?, ?, 'PROGRAMADO') RETURNING id_evento
                """, Long.class, idEstadio, idLocal, idVisitante, fechaHora, duracion, idAdmin);
    }

    public Long insertarEventoSector(Long idEvento, Long idSector, Integer cupo, BigDecimal precio) {
        return jdbc.queryForObject("""
                INSERT INTO evento_sector (id_evento, id_sector, cupo_habilitado, precio)
                VALUES (?, ?, ?, ?) RETURNING id_evento_sector
                """, Long.class, idEvento, idSector, cupo, precio);
    }

    public void cancelarEvento(Long idEvento) {
        // el trigger de la BD se encarga de liberar el slot del estadio
        jdbc.update("UPDATE evento SET estado = 'CANCELADO' WHERE id_evento = ?", idEvento);
    }
}
