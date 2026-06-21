package uy.edu.ucu.ticketing.repository;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Repository
public class DispositivoRepository {

    private final JdbcTemplate jdbc;

    public DispositivoRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public List<Map<String, Object>> findAll() {
        return jdbc.queryForList("""
                SELECT d.id_dispositivo, d.identificador_fisico, d.estado::text AS estado,
                       d.fecha_registro,
                       u.nombre AS funcionario_nombre,
                       u.apellido AS funcionario_apellido,
                       u.email::text AS funcionario_email,
                       fv.numero_legajo
                FROM dispositivo d
                JOIN funcionario_validacion fv ON fv.id_usuario = d.id_funcionario
                JOIN usuario u ON u.id_usuario = d.id_funcionario
                ORDER BY d.fecha_registro DESC
                """);
    }

    public boolean existeFuncionario(Long idFuncionario) {
        Integer count = jdbc.queryForObject(
                "SELECT COUNT(*) FROM funcionario_validacion WHERE id_usuario = ?",
                Integer.class, idFuncionario);
        return count != null && count > 0;
    }

    // inserto el dispositivo con estado ACTIVO por default
    public Long insertar(String identificadorFisico, Long idFuncionario) {
        return jdbc.queryForObject("""
                INSERT INTO dispositivo (identificador_fisico, id_funcionario, estado)
                VALUES (?, ?, 'ACTIVO')
                RETURNING id_dispositivo
                """, Long.class, identificadorFisico, idFuncionario);
    }

    public void desactivar(Long idDispositivo) {
        jdbc.update("UPDATE dispositivo SET estado = 'INACTIVO' WHERE id_dispositivo = ?", idDispositivo);
    }

    public Optional<Map<String, Object>> findById(Long idDispositivo) {
        List<Map<String, Object>> rows = jdbc.queryForList(
                "SELECT id_dispositivo, identificador_fisico, estado::text AS estado, fecha_registro, id_funcionario FROM dispositivo WHERE id_dispositivo = ?",
                idDispositivo);
        return rows.isEmpty() ? Optional.empty() : Optional.of(rows.get(0));
    }
}
