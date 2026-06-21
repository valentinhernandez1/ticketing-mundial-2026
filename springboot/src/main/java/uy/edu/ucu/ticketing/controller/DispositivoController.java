package uy.edu.ucu.ticketing.controller;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import uy.edu.ucu.ticketing.service.DispositivoService;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/dispositivos")
@PreAuthorize("hasRole('ADMINISTRADOR_PAIS')")
public class DispositivoController {

    private final DispositivoService dispositivoService;

    public DispositivoController(DispositivoService dispositivoService) {
        this.dispositivoService = dispositivoService;
    }

    public record DispositivoRequest(@NotBlank String identificadorFisico, @NotNull Long idFuncionario) {}

    @GetMapping
    public List<Map<String, Object>> listar() {
        return dispositivoService.listar();
    }

    @PostMapping
    public Map<String, Object> registrar(@Valid @RequestBody DispositivoRequest req) {
        Long id = dispositivoService.registrar(req.identificadorFisico(), req.idFuncionario());
        return Map.of("idDispositivo", id);
    }

    @DeleteMapping("/{id}")
    public Map<String, Object> desactivar(@PathVariable Long id) {
        dispositivoService.desactivar(id);
        return Map.of("mensaje", "Dispositivo desactivado");
    }
}
