package uy.edu.ucu.ticketing.repository;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Map;

@Repository
public class FuncionarioValidacionRepository {

    private final JdbcTemplate jdbc;

    public FuncionarioValidacionRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    // lista todos los funcionarios con datos del usuario y legajo
    public List<Map<String, Object>> findAll() {
        return jdbc.queryForList("""
                SELECT u.id_usuario, u.nombre, u.apellido, u.email::text AS email,
                       fv.numero_legajo
                FROM funcionario_validacion fv
                JOIN usuario u ON u.id_usuario = fv.id_usuario
                ORDER BY u.apellido
                """);
    }

    // inserta un nuevo funcionario_validacion
    public void insertar(Long idUsuario, String numeroLegajo) {
        jdbc.update("""
                INSERT INTO funcionario_validacion (id_usuario, numero_legajo)
                VALUES (?, ?)
                """, idUsuario, numeroLegajo);
    }
}
