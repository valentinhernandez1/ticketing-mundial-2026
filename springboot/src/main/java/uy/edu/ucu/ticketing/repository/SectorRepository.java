package uy.edu.ucu.ticketing.repository;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Repository
public class SectorRepository {

    private final JdbcTemplate jdbc;

    public SectorRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public Optional<Integer> capacidadMaxima(Long idSector) {
        List<Map<String, Object>> rows = jdbc.queryForList(
                "SELECT capacidad_maxima FROM sector WHERE id_sector = ?", idSector);
        return rows.isEmpty() ? Optional.empty()
                : Optional.of(((Number) rows.get(0).get("capacidad_maxima")).intValue());
    }

    public Long insertar(Long idAdmin, Long idEstadio, String nombreSector, Integer capacidadMaxima, BigDecimal precioBase) {
        return jdbc.queryForObject(
                "SELECT fn_agregar_sector_wrapper(?, ?, ?, ?, ?)",
                Long.class, idAdmin, idEstadio, nombreSector, capacidadMaxima, precioBase);
    }

    public List<Map<String, Object>> sectoresDeEstadio(Long idEstadio) {
        return jdbc.queryForList("""
                SELECT id_sector, nombre_sector::text AS nombre
                FROM sector WHERE id_estadio = ?
                ORDER BY nombre_sector
                """, idEstadio);
    }
}
