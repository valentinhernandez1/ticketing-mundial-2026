package uy.edu.ucu.ticketing.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import uy.edu.ucu.ticketing.repository.ReporteRepository;

import java.util.List;
import java.util.Map;

@Service
public class ReporteService {

    private final ReporteRepository reporteRepo;

    public ReporteService(ReporteRepository reporteRepo) {
        this.reporteRepo = reporteRepo;
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> rankingCompradores() {
        return reporteRepo.rankingCompradores();
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> eventosTop() {
        return reporteRepo.eventosTop();
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> estadisticasEstadio() {
        return reporteRepo.estadisticasEstadio();
    }
}
