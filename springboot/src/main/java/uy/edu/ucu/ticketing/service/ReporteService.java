package uy.edu.ucu.ticketing.service;

import org.springframework.stereotype.Service;
import uy.edu.ucu.ticketing.repository.ReporteRepository;
import java.util.List;

@Service
public class ReporteService {

    private final ReporteRepository repo;
    public ReporteService(ReporteRepository repo) { this.repo = repo; }

    public List<Object[]> rankingCompradores(int top) { return repo.rankingCompradores(top); }
    public List<Object[]> eventosTop(int top)         { return repo.eventosTop(top); }
    public List<Object[]> estadisticasEstadio()       { return repo.estadisticasEstadio(); }
}
