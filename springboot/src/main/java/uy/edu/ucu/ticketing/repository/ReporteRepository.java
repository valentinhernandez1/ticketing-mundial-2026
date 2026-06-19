package uy.edu.ucu.ticketing.repository;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.*;

@Repository
public class ReporteRepository {

    private final JdbcTemplate jdbc;

    public ReporteRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public List<Map<String, Object>> rankingCompradores() {
        return jdbc.queryForList("SELECT * FROM fn_reporte_ranking_compradores(10)");
    }

    public List<Map<String, Object>> eventosTop() {
        return jdbc.queryForList("SELECT * FROM fn_reporte_eventos_top(10)");
    }

    public List<Map<String, Object>> estadisticasEstadio() {
        return jdbc.queryForList("SELECT * FROM fn_reporte_estadisticas_estadio()");
    }
}
