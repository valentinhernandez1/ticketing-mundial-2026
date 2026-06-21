package uy.edu.ucu.ticketing.repository;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@Repository
public class AuthRepository {

    private final JdbcTemplate jdbc;

    public AuthRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public Optional<Map<String, Object>> findByEmail(String email) {
        List<Map<String, Object>> rows = jdbc.queryForList("""
                SELECT id_usuario, email::text AS email, password_hash, nombre, apellido
                FROM usuario WHERE email = ?
                """, email);
        return rows.isEmpty() ? Optional.empty() : Optional.of(rows.get(0));
    }

    // orden importa: direccion → usuario → documento → usuario_general (FK)
    public Long registrarUsuario(String email, String hash, String nombre, String apellido,
                                  Integer dirIdPais, String localidad, String calle,
                                  String numero, String cp,
                                  Integer docIdPais, String tipoDoc, String docNumero) {
        Long idDir = jdbc.queryForObject("""
                INSERT INTO direccion (id_pais, localidad, calle, numero, codigo_postal)
                VALUES (?, ?, ?, ?, ?) RETURNING id_direccion
                """, Long.class, dirIdPais, localidad, calle, numero, cp);

        Long idUsuario = jdbc.queryForObject("""
                INSERT INTO usuario (email, nombre, apellido, id_direccion, password_hash)
                VALUES (?, ?, ?, ?, ?) RETURNING id_usuario
                """, Long.class, email, nombre, apellido, idDir, hash);

        jdbc.update("""
                INSERT INTO documento (id_usuario, id_pais, tipo_documento, numero)
                VALUES (?, ?, ?, ?)
                """, idUsuario, docIdPais, tipoDoc, docNumero);

        jdbc.update("""
                INSERT INTO usuario_general (id_usuario, identidad_verificada)
                VALUES (?, FALSE)
                """, idUsuario);

        return idUsuario;
    }

    public void insertarTelefono(Long idUsuario, String numero, String tipo) {
        jdbc.update("""
                INSERT INTO telefono (id_usuario, numero, tipo) VALUES (?, ?, ?)
                """, idUsuario, numero, tipo);
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
}
