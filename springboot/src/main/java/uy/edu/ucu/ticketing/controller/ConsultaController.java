package uy.edu.ucu.ticketing.controller;

import org.springframework.web.bind.annotation.*;
import uy.edu.ucu.ticketing.dto.ConsultaDtos.*;
import uy.edu.ucu.ticketing.service.ConsultaService;
import java.util.List;

/** Consultas de solo lectura para el frontend (cualquier usuario autenticado). */
@RestController
@RequestMapping("/api/consulta")
public class ConsultaController {

    private final ConsultaService service;
    public ConsultaController(ConsultaService service) { this.service = service; }

    /** Eventos disponibles con sectores y disponibilidad (para comprar). */
    @GetMapping("/eventos")
    public List<EventoDisp> eventos() {
        return service.eventosDisponibles();
    }

    /** Catalogos para los formularios del administrador. */
    @GetMapping("/catalogos")
    public Catalogos catalogos() {
        return service.catalogos();
    }

    /** Sectores de un estadio (para habilitarlos en un evento). */
    @GetMapping("/estadios/{id}/sectores")
    public List<Item> sectoresDeEstadio(@PathVariable Long id) {
        return service.sectoresDeEstadio(id);
    }
}
