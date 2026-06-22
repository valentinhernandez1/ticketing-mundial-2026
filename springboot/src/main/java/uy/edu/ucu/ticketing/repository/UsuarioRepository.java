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

    // busco con hash para el login
    public Optional<Map<String, Object>> findByEmailConHash(String email) {
        List<Map<String, Object>> rows = jdbc.queryForList("""
                SELECT id_usuario, email::text AS email, password_hash, nombre, apellido
                FROM usuario WHERE email = ?
                """, email);
        return rows.isEmpty() ? Optional.empty() : Optional.of(rows.get(0));
    }

    public Long insertar(String email, String hash, String nombre, String apellido, Long idDireccion) {
        return jdbc.queryForObject("""
                INSERT INTO usuario (email, nombre, apellido, id_direccion, password_hash)
                VALUES (?, ?, ?, ?, ?) RETURNING id_usuario
                """, Long.class, email, nombre, apellido, idDireccion, hash);
    }

    // miro las tablas de especialización para saber el rol
    public String getRol(Long idUsuario) {
        Integer esAdmin = jdbc.queryForObject(
                "SELECT COUNT(*) FROM administrador_pais WHERE id_usuario = ?", Integer.class, idUsuario);
        if (esAdmin != null && esAdmin > 0) return "ADMINISTRADOR_PAIS";

        Integer esFuncionario = jdbc.queryForObject(
                "SELECT COUNT(*) FROM funcionario_validacion WHERE id_usuario = ?", Integer.class, idUsuario);
        if (esFuncionario != null && esFuncionario > 0) return "FUNCIONARIO_VALIDACION";

        return "USUARIO_GENERAL";
    }

    public Optional<Integer> paisDelAdmin(Long idAdmin) {
        List<Map<String, Object>> rows = jdbc.queryForList(
                "SELECT id_pais FROM administrador_pais WHERE id_usuario = ?", idAdmin);
        return rows.isEmpty() ? Optional.empty()
                : Optional.of(((Number) rows.get(0).get("id_pais")).intValue());
    }
}
