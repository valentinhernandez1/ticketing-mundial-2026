package uy.edu.ucu.ticketing.controller;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import uy.edu.ucu.ticketing.dto.AdminDtos.*;
import uy.edu.ucu.ticketing.service.AdminService;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/eventos")
@PreAuthorize("hasRole('ADMINISTRADOR_PAIS')")
public class EventoController {

    private final AdminService service;
    public EventoController(AdminService service) { this.service = service; }

    @GetMapping
    public List<Map<String, Object>> listar() {
        return service.listarEventos();
    }

    @PostMapping
    public ResponseEntity<Map<String,Object>> crear(@AuthenticationPrincipal Long uid,
                                                    @Valid @RequestBody EventoRequest req) {
        return ResponseEntity.ok(Map.of("idEvento", service.crearEvento(uid, req), "estado", "PROGRAMADO"));
    }

    @PostMapping("/{id}/sectores")
    public ResponseEntity<Map<String,Object>> habilitarSector(@AuthenticationPrincipal Long uid,
                                                             @PathVariable Long id,
                                                             @Valid @RequestBody HabilitarSectorRequest req) {
        return ResponseEntity.ok(Map.of("idEventoSector", service.habilitarSector(uid, id, req)));
    }

    @PostMapping("/{id}/cancelar")
    public ResponseEntity<Map<String,Object>> cancelar(@AuthenticationPrincipal Long uid,
                                                      @PathVariable Long id) {
        service.cancelarEvento(uid, id);
        return ResponseEntity.ok(Map.of("idEvento", id, "estado", "CANCELADO"));
    }
}
