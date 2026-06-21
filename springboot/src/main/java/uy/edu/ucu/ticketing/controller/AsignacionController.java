package uy.edu.ucu.ticketing.controller;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import org.springframework.web.bind.annotation.*;
import uy.edu.ucu.ticketing.service.AsignacionService;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/asignaciones")
public class AsignacionController {

    private final AsignacionService asignacionService;

    public AsignacionController(AsignacionService asignacionService) {
        this.asignacionService = asignacionService;
    }

    public record AsignacionRequest(@NotNull Long idFuncionario, @NotNull Long idEvento, @NotNull Long idSector) {}

    @GetMapping("/evento/{idEvento}")
    public List<Map<String, Object>> porEvento(@PathVariable Long idEvento) {
        return asignacionService.porEvento(idEvento);
    }

    @PostMapping
    public Map<String, Object> asignar(@Valid @RequestBody AsignacionRequest req) {
        Long id = asignacionService.asignar(req.idFuncionario(), req.idEvento(), req.idSector());
        return Map.of("idAsignacion", id);
    }

    @DeleteMapping("/{id}")
    public Map<String, Object> eliminar(@PathVariable Long id) {
        asignacionService.eliminar(id);
        return Map.of("mensaje", "Asignación eliminada");
    }
}
