package uy.edu.ucu.ticketing.repository;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Repository
public class ComisionRepository {

    private final JdbcTemplate jdbc;

    public ComisionRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public List<Map<String, Object>> findAll() {
        return jdbc.queryForList(
                "SELECT id_comision, porcentaje, fecha_inicio, fecha_fin FROM comision ORDER BY fecha_inicio DESC");
    }

    // cierro la actual y abro la nueva
    public Long insertar(BigDecimal porcentaje, LocalDate fechaInicio) {
        // calculo la fecha anterior en Java para evitar cast implícito DATE→TIMESTAMP en postgres
        jdbc.update("UPDATE comision SET fecha_fin = ? WHERE fecha_fin IS NULL",
                fechaInicio.minusDays(1));

        return jdbc.queryForObject("""
                INSERT INTO comision (porcentaje, fecha_inicio)
                VALUES (?, ?) RETURNING id_comision
                """, Long.class, porcentaje, fechaInicio);
    }
}
