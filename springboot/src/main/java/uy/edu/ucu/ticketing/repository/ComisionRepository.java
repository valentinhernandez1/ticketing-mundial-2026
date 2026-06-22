package uy.edu.ucu.ticketing.repository;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;

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

    public Optional<Map<String, Object>> vigente() {
        List<Map<String, Object>> rows = jdbc.queryForList("""
                SELECT id_comision, porcentaje
                FROM comision
                WHERE fecha_inicio <= CURRENT_DATE
                  AND (fecha_fin IS NULL OR fecha_fin >= CURRENT_DATE)
                ORDER BY fecha_inicio DESC
                LIMIT 1
                """);
        return rows.isEmpty() ? Optional.empty() : Optional.of(rows.get(0));
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
