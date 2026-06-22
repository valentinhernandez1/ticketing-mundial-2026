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
