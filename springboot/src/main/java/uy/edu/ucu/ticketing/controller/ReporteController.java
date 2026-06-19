package uy.edu.ucu.ticketing.controller;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import uy.edu.ucu.ticketing.service.ReporteService;
import java.util.List;

@RestController
@RequestMapping("/api/reportes")
@PreAuthorize("hasRole('ADMINISTRADOR_PAIS')")
public class ReporteController {

    private final ReporteService service;
    public ReporteController(ReporteService service) { this.service = service; }

    @GetMapping("/ranking-compradores")
    public List<Object[]> ranking(@RequestParam(defaultValue = "10") int top) {
        return service.rankingCompradores(top);
    }

    @GetMapping("/eventos-top")
    public List<Object[]> eventosTop(@RequestParam(defaultValue = "10") int top) {
        return service.eventosTop(top);
    }

    @GetMapping("/estadisticas-estadio")
    public List<Object[]> estadisticas() {
        return service.estadisticasEstadio();
    }
}
