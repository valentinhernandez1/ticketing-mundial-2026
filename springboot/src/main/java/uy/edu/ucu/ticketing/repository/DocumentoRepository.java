package uy.edu.ucu.ticketing.repository;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class DocumentoRepository {

    private final JdbcTemplate jdbc;

    public DocumentoRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public void insertar(Long idUsuario, Integer idPais, String tipoDocumento, String numero) {
        jdbc.update("""
                INSERT INTO documento (id_usuario, id_pais, tipo_documento, numero)
                VALUES (?, ?, ?, ?)
                """, idUsuario, idPais, tipoDocumento, numero);
    }
}
