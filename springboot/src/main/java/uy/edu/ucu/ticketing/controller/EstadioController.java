package uy.edu.ucu.ticketing.controller;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import uy.edu.ucu.ticketing.dto.AdminDtos.*;
import uy.edu.ucu.ticketing.service.AdminService;
import java.util.Map;

@RestController
@RequestMapping("/api/estadios")
@PreAuthorize("hasRole('ADMINISTRADOR_PAIS')")
public class EstadioController {

    private final AdminService service;
    public EstadioController(AdminService service) { this.service = service; }

    @PostMapping
    public ResponseEntity<Map<String,Object>> crear(@AuthenticationPrincipal Long uid,
                                                    @Valid @RequestBody EstadioRequest req) {
        return ResponseEntity.ok(Map.of("idEstadio", service.crearEstadio(uid, req)));
    }

    @PostMapping("/{id}/sectores")
    public ResponseEntity<Map<String,Object>> agregarSector(@AuthenticationPrincipal Long uid,
                                                            @PathVariable Long id,
                                                            @Valid @RequestBody SectorRequest req) {
        return ResponseEntity.ok(Map.of("idSector", service.agregarSector(uid, id, req)));
    }
}
