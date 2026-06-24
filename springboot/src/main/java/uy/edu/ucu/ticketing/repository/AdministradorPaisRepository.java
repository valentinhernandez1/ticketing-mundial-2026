package uy.edu.ucu.ticketing.repository;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Repository
public class AdministradorPaisRepository {

    private final JdbcTemplate jdbc;

    public AdministradorPaisRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    // lista todos los admins con datos del usuario y país sede
    public List<Map<String, Object>> findAll() {
        return jdbc.queryForList("""
                SELECT u.id_usuario, u.nombre, u.apellido, u.email::text AS email,
                       p.nombre AS "paisSede", a.fecha_asignacion
                FROM administrador_pais a
                JOIN usuario u ON u.id_usuario = a.id_usuario
                JOIN pais p ON p.id_pais = a.id_pais
                ORDER BY u.apellido
                """);
    }

    // inserta un nuevo administrador_pais
    public void insertar(Long idUsuario, Integer idPais, LocalDate fechaAsignacion) {
        jdbc.update("""
                INSERT INTO administrador_pais (id_usuario, id_pais, fecha_asignacion)
                VALUES (?, ?, ?)
                """, idUsuario, idPais, fechaAsignacion);
    }
}
