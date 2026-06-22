package uy.edu.ucu.ticketing.repository;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class DireccionRepository {

    private final JdbcTemplate jdbc;

    public DireccionRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public Long insertar(Integer idPais, String localidad, String calle, String numero, String codigoPostal) {
        return jdbc.queryForObject("""
                INSERT INTO direccion (id_pais, localidad, calle, numero, codigo_postal)
                VALUES (?, ?, ?, ?, ?) RETURNING id_direccion
                """, Long.class, idPais, localidad, calle, numero, codigoPostal);
    }
}
