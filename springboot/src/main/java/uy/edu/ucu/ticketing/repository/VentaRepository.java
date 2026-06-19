package uy.edu.ucu.ticketing.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import uy.edu.ucu.ticketing.domain.Venta;
import java.util.List;

public interface VentaRepository extends JpaRepository<Venta, Long> {

    /** Compras (ventas) de un usuario con su cantidad de entradas y montos. */
    @Query(value = "SELECT * FROM fn_compras_usuario(:id)", nativeQuery = true)
    List<Object[]> comprasUsuario(@Param("id") Long idUsuario);
}
