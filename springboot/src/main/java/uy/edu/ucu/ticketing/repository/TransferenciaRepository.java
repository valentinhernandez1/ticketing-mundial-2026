package uy.edu.ucu.ticketing.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import uy.edu.ucu.ticketing.domain.Transferencia;
import java.util.List;

public interface TransferenciaRepository extends JpaRepository<Transferencia, Long> {

    @Query("""
           SELECT t FROM Transferencia t
           WHERE t.idUsuarioOrigen = :id OR t.idUsuarioDestino = :id
           ORDER BY t.fechaTransferencia DESC
           """)
    List<Transferencia> porUsuario(@Param("id") Long idUsuario);
}
