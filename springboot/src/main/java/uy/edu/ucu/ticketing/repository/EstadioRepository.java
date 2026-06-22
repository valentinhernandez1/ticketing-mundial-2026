package uy.edu.ucu.ticketing.repository;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@Repository
public class EstadioRepository {

    private final JdbcTemplate jdbc;

    public EstadioRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public Optional<Map<String, Object>> findById(Long idEstadio) {
        List<Map<String, Object>> rows = jdbc.queryForList(
                "SELECT id_estadio, id_pais, nombre FROM estadio WHERE id_estadio = ?", idEstadio);
        return rows.isEmpty() ? Optional.empty() : Optional.of(rows.get(0));
    }

    // helper para AdminService: necesito el pais del estadio para verificar jurisdicción
    public Optional<Integer> paisDel(Long idEstadio) {
        return findById(idEstadio)
                .map(r -> ((Number) r.get("id_pais")).intValue());
    }

    public Long insertar(String nombre, Integer idPais, String ciudad, String direccion) {
        return jdbc.queryForObject("""
                INSERT INTO estadio (nombre, id_pais, ciudad, direccion)
                VALUES (?, ?, ?, ?) RETURNING id_estadio
                """, Long.class, nombre, idPais, ciudad, direccion);
    }
}
