package uy.edu.ucu.ticketing.service;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
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
        if (fechaInicio.isBefore(LocalDate.now()))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "La fecha de inicio no puede ser anterior a hoy");
        return comisionRepo.insertar(porcentaje, fechaInicio);
    }
}
