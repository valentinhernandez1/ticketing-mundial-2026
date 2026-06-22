package uy.edu.ucu.ticketing.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import uy.edu.ucu.ticketing.repository.PaisRepository;

import java.util.List;
import java.util.Map;

@Service
public class PaisService {

    private final PaisRepository paisRepo;

    public PaisService(PaisRepository paisRepo) {
        this.paisRepo = paisRepo;
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> listar() {
        return paisRepo.findAll();
    }
}
