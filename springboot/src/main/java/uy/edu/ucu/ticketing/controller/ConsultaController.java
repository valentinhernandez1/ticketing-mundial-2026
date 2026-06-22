package uy.edu.ucu.ticketing.controller;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import uy.edu.ucu.ticketing.dto.ConsultaDtos.*;
import uy.edu.ucu.ticketing.service.ConsultaService;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/consulta")
public class ConsultaController {

    private final ConsultaService service;
    public ConsultaController(ConsultaService service) { this.service = service; }

    @GetMapping("/eventos")
    public List<EventoDisp> eventos() {
        return service.eventosDisponibles();
    }

    @GetMapping("/catalogos")
    public Catalogos catalogos() {
        return service.catalogos();
    }

    @GetMapping("/estadios/{id}/sectores")
    public List<Item> sectoresDeEstadio(@PathVariable Long id) {
        return service.sectoresDeEstadio(id);
    }

    @GetMapping("/funcionarios")
    @PreAuthorize("hasRole('ADMINISTRADOR_PAIS')")
    public List<Map<String, Object>> funcionarios() {
        return service.funcionarios();
    }

}
