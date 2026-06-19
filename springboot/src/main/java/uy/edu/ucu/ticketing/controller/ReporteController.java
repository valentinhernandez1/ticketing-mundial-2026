package uy.edu.ucu.ticketing.controller;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import uy.edu.ucu.ticketing.service.ReporteService;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reportes")
@PreAuthorize("hasRole('ADMINISTRADOR_PAIS')")
public class ReporteController {

    private final ReporteService service;

    public ReporteController(ReporteService service) {
        this.service = service;
    }

    @GetMapping("/ranking-compradores")
    public List<Map<String, Object>> ranking() {
        return service.rankingCompradores();
    }

    @GetMapping("/eventos-top")
    public List<Map<String, Object>> eventosTop() {
        return service.eventosTop();
    }

    @GetMapping("/estadisticas-estadio")
    public List<Map<String, Object>> estadisticas() {
        return service.estadisticasEstadio();
    }
}
