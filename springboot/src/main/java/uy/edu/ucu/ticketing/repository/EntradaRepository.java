package uy.edu.ucu.ticketing.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import uy.edu.ucu.ticketing.domain.Entrada;
import uy.edu.ucu.ticketing.domain.enums.EstadoEntrada;
import java.util.Collection;
import java.util.List;

public interface EntradaRepository extends JpaRepository<Entrada, Long> {

    @Query("""
           SELECT e FROM Entrada e
           WHERE e.idUsuarioActual = :idUsuario
             AND e.estado IN :estados
           """)
    List<Entrada> entradasActuales(@Param("idUsuario") Long idUsuario,
                                   @Param("estados") Collection<EstadoEntrada> estados);

    List<Entrada> findByIdVenta(Long idVenta);
}
