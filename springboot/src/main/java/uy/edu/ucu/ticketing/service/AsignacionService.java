package uy.edu.ucu.ticketing.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import uy.edu.ucu.ticketing.repository.AsignacionRepository;

import java.util.List;
import java.util.Map;

@Service
public class AsignacionService {

    private final AsignacionRepository asignacionRepo;

    public AsignacionService(AsignacionRepository asignacionRepo) {
        this.asignacionRepo = asignacionRepo;
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> porEvento(Long idEvento) {
        return asignacionRepo.findPorEvento(idEvento);
    }

    @Transactional
    public Long asignar(Long idFuncionario, Long idEvento, Long idSector) {
        return asignacionRepo.insertar(idFuncionario, idEvento, idSector);
    }

    @Transactional
    public void eliminar(Long idAsignacion) {
        asignacionRepo.eliminar(idAsignacion);
    }
}
