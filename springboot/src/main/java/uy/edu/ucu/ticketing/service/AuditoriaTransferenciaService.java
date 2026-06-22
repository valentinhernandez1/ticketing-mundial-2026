package uy.edu.ucu.ticketing.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import uy.edu.ucu.ticketing.repository.AuditoriaTransferenciaRepository;

import java.util.List;
import java.util.Map;

@Service
public class AuditoriaTransferenciaService {

    private final AuditoriaTransferenciaRepository auditoriaRepo;

    public AuditoriaTransferenciaService(AuditoriaTransferenciaRepository auditoriaRepo) {
        this.auditoriaRepo = auditoriaRepo;
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> historialEntrada(Long idEntrada) {
        return auditoriaRepo.findByEntrada(idEntrada);
    }
}
