package uy.edu.ucu.ticketing.repository;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class EntradaRepository {

    private final JdbcTemplate jdbc;

    public EntradaRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }
}
