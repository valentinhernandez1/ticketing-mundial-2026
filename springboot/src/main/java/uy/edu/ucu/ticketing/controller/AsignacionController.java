package uy.edu.ucu.ticketing.controller;

import org.springframework.web.bind.annotation.*;
import uy.edu.ucu.ticketing.repository.AsignacionRepository;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/asignaciones")
public class AsignacionController {

    private final AsignacionRepository asignacionRepo;

    public AsignacionController(AsignacionRepository asignacionRepo) {
        this.asignacionRepo = asignacionRepo;
    }

    // asignaciones de un evento
    @GetMapping("/evento/{idEvento}")
    public List<Map<String, Object>> porEvento(@PathVariable Long idEvento) {
        return asignacionRepo.findPorEvento(idEvento);
    }

    // asignar funcionario a sector de evento
    @PostMapping
    public Map<String, Object> asignar(@RequestBody Map<String, Object> body) {
        Long idFuncionario = ((Number) body.get("idFuncionario")).longValue();
        Long idEvento = ((Number) body.get("idEvento")).longValue();
        Long idSector = ((Number) body.get("idSector")).longValue();
        Long id = asignacionRepo.insertar(idFuncionario, idEvento, idSector);
        return Map.of("idAsignacion", id);
    }

    @DeleteMapping("/{id}")
    public Map<String, Object> eliminar(@PathVariable Long id) {
        asignacionRepo.eliminar(id);
        return Map.of("mensaje", "Asignación eliminada");
    }
}
