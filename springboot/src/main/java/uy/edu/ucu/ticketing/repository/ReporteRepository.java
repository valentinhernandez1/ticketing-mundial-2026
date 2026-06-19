package uy.edu.ucu.ticketing.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import uy.edu.ucu.ticketing.domain.Venta;
import java.util.List;

/**
 * Reportes (Fase 6): se apoyan en las funciones SQL del modelo fisico
 * (fn_reporte_*) mediante consultas nativas. Devuelven Object[] que el
 * service mapea a DTOs.
 */
public interface ReporteRepository extends JpaRepository<Venta, Long> {

    @Query(value = "SELECT * FROM fn_reporte_ranking_compradores(:top)", nativeQuery = true)
    List<Object[]> rankingCompradores(@Param("top") int top);

    @Query(value = "SELECT * FROM fn_reporte_eventos_top(:top)", nativeQuery = true)
    List<Object[]> eventosTop(@Param("top") int top);

    @Query(value = "SELECT * FROM fn_reporte_estadisticas_estadio()", nativeQuery = true)
    List<Object[]> estadisticasEstadio();
}
