package uy.edu.ucu.ticketing.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import uy.edu.ucu.ticketing.domain.Evento;

public interface EventoRepository extends JpaRepository<Evento, Long> {
}
