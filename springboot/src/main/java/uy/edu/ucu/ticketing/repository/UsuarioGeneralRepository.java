package uy.edu.ucu.ticketing.repository;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class UsuarioGeneralRepository {

    private final JdbcTemplate jdbc;

    public UsuarioGeneralRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    // identidad_verificada arranca en FALSE, se actualiza cuando el funcionario valida
    public void insertar(Long idUsuario) {
        jdbc.update("""
                INSERT INTO usuario_general (id_usuario, identidad_verificada)
                VALUES (?, FALSE)
                """, idUsuario);
    }
}
