package uy.edu.ucu.ticketing.repository;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;

@Repository
public class EntradaRepository {

    private final JdbcTemplate jdbc;

    public EntradaRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public Long insertar(Long idVenta, Long idEventoSector, Long idUsuario, BigDecimal precio) {
        return jdbc.queryForObject("""
                INSERT INTO entrada (id_venta, id_evento_sector, id_usuario_actual, estado, precio)
                VALUES (?, ?, ?, 'EMITIDA', ?)
                RETURNING id_entrada
                """, Long.class, idVenta, idEventoSector, idUsuario, precio);
    }
}
