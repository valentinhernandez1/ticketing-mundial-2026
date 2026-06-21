package uy.edu.ucu.ticketing.repository;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Map;

@Repository
public class TelefonoRepository {

    private final JdbcTemplate jdbc;

    public TelefonoRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public List<Map<String, Object>> findByUsuario(Long idUsuario) {
        return jdbc.queryForList(
                "SELECT id_telefono AS \"idTelefono\", numero, tipo FROM telefono WHERE id_usuario = ? ORDER BY id_telefono",
                idUsuario);
    }

    public Long insertar(Long idUsuario, String numero, String tipo) {
        return jdbc.queryForObject(
                "INSERT INTO telefono(id_usuario, numero, tipo) VALUES (?, ?, ?) RETURNING id_telefono",
                Long.class, idUsuario, numero, tipo);
    }

    public int eliminar(Long idTelefono, Long idUsuario) {
        return jdbc.update(
                "DELETE FROM telefono WHERE id_telefono = ? AND id_usuario = ?", idTelefono, idUsuario);
    }
}
