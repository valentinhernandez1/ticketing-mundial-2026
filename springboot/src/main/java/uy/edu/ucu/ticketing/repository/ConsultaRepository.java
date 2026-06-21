package uy.edu.ucu.ticketing.repository;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Map;

@Repository
public class ConsultaRepository {

    private final JdbcTemplate jdbc;

    public ConsultaRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public List<Map<String, Object>> eventosDisponibles() {
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

    // para el dropdown del registro
    public List<Map<String, Object>> paises() {
        return jdbc.queryForList(
                "SELECT id_pais, codigo_iso, nombre FROM pais ORDER BY nombre");
    }

    public List<Map<String, Object>> paisesSede() {
        return jdbc.queryForList("""
                SELECT p.id_pais, p.nombre FROM pais_sede ps
                JOIN pais p ON p.id_pais = ps.id_pais
                ORDER BY p.nombre
                """);
    }

    public List<Map<String, Object>> selecciones() {
        return jdbc.queryForList("SELECT id_seleccion, nombre FROM seleccion ORDER BY nombre");
    }

    public List<Map<String, Object>> estadios() {
        return jdbc.queryForList("SELECT id_estadio, nombre FROM estadio ORDER BY nombre");
    }

    public List<Map<String, Object>> sectoresDeEstadio(Long idEstadio) {
        return jdbc.queryForList("""
                SELECT id_sector, nombre_sector::text AS nombre
                FROM sector WHERE id_estadio = ?
                ORDER BY nombre_sector
                """, idEstadio);
    }

    public List<Map<String, Object>> funcionarios() {
        return jdbc.queryForList("""
                SELECT u.id_usuario, u.nombre, u.apellido, u.email::text AS email,
                       fv.numero_legajo
                FROM funcionario_validacion fv
                JOIN usuario u ON u.id_usuario = fv.id_usuario
                ORDER BY u.apellido
                """);
    }
}
