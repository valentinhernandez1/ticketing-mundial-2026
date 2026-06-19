package uy.edu.ucu.ticketing.service;

import org.springframework.stereotype.Service;
import uy.edu.ucu.ticketing.repository.ReporteRepository;

import java.util.List;
import java.util.Map;

@Service
public class ReporteService {

    private final ReporteRepository reporteRepo;

    public ReporteService(ReporteRepository reporteRepo) {
        this.reporteRepo = reporteRepo;
    }

    public List<Map<String, Object>> rankingCompradores() {
        return reporteRepo.rankingCompradores();
    }

    public List<Map<String, Object>> eventosTop() {
        return reporteRepo.eventosTop();
    }

    public List<Map<String, Object>> estadisticasEstadio() {
        return reporteRepo.estadisticasEstadio();
    }
}
