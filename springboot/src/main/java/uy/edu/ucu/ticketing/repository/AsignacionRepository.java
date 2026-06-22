package uy.edu.ucu.ticketing.repository;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Map;

@Repository
public class AsignacionRepository {

    private final JdbcTemplate jdbc;

    public AsignacionRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public List<Map<String, Object>> findPorEvento(Long idEvento) {
        return jdbc.queryForList("""
                SELECT a.id_asignacion, a.id_funcionario, a.id_evento, a.id_sector,
                       u.nombre AS funcionario_nombre, u.apellido AS funcionario_apellido,
                       s.nombre_sector::text AS sector
                FROM asignacion_funcionario_sector a
                JOIN usuario u ON u.id_usuario = a.id_funcionario
                JOIN sector s ON s.id_sector = a.id_sector
                WHERE a.id_evento = ?
                ORDER BY s.nombre_sector
                """, idEvento);
    }

    public Long insertar(Long idFuncionario, Long idEvento, Long idSector) {
        return jdbc.queryForObject("""
                INSERT INTO asignacion_funcionario_sector (id_funcionario, id_evento, id_sector)
                VALUES (?, ?, ?)
                RETURNING id_asignacion
                """, Long.class, idFuncionario, idEvento, idSector);
    }

    // Usado por DELETE /api/asignaciones/{id} en AsignacionController
    public void eliminar(Long idAsignacion) {
        jdbc.update("DELETE FROM asignacion_funcionario_sector WHERE id_asignacion = ?", idAsignacion);
    }
}
