package uy.edu.ucu.ticketing.repository;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@Repository
public class UsuarioRepository {

    private final JdbcTemplate jdbc;

    public UsuarioRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    // busco usuario por email para poder pasarle una entrada
    public Optional<Map<String, Object>> findByEmail(String email) {
        List<Map<String, Object>> rows = jdbc.queryForList(
                "SELECT id_usuario FROM usuario WHERE email = ?", email);
        return rows.isEmpty() ? Optional.empty() : Optional.of(rows.get(0));
    }
}
