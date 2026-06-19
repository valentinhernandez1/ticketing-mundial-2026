package uy.edu.ucu.ticketing.controller;

import org.springframework.web.bind.annotation.*;
import uy.edu.ucu.ticketing.service.DispositivoService;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/dispositivos")
public class DispositivoController {

    private final DispositivoService dispositivoService;

    public DispositivoController(DispositivoService dispositivoService) {
        this.dispositivoService = dispositivoService;
    }

    @GetMapping
    public List<Map<String, Object>> listar() {
        return dispositivoService.listar();
    }

    @PostMapping
    public Map<String, Object> registrar(@RequestBody Map<String, Object> body) {
        String identificador = (String) body.get("identificadorFisico");
        Long idFuncionario = ((Number) body.get("idFuncionario")).longValue();
        Long id = dispositivoService.registrar(identificador, idFuncionario);
        return Map.of("idDispositivo", id);
    }

    @DeleteMapping("/{id}")
    public Map<String, Object> desactivar(@PathVariable Long id) {
        dispositivoService.desactivar(id);
        return Map.of("mensaje", "Dispositivo desactivado");
    }
}
