package uy.edu.ucu.ticketing.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import uy.edu.ucu.ticketing.repository.ComisionRepository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Service
public class ComisionService {

    private final ComisionRepository comisionRepo;

    public ComisionService(ComisionRepository comisionRepo) {
        this.comisionRepo = comisionRepo;
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> listar() {
        return comisionRepo.findAll();
    }

    @Transactional
    public Long crear(BigDecimal porcentaje, LocalDate fechaInicio) {
        return comisionRepo.insertar(porcentaje, fechaInicio);
    }
}
