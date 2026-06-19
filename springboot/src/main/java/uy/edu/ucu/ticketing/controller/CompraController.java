package uy.edu.ucu.ticketing.controller;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import uy.edu.ucu.ticketing.dto.CompraRequest;
import uy.edu.ucu.ticketing.service.CompraService;
import java.util.Map;

@RestController
@RequestMapping("/api/compras")
public class CompraController {

    private final CompraService service;
    public CompraController(CompraService service) { this.service = service; }

    @PostMapping
    @PreAuthorize("hasRole('USUARIO_GENERAL')")
    public ResponseEntity<Map<String,Object>> comprar(@AuthenticationPrincipal Long uid,
                                                      @Valid @RequestBody CompraRequest req) {
        Long idVenta = service.registrarCompra(uid, req);
        return ResponseEntity.ok(Map.of("idVenta", idVenta, "estado", "CONFIRMADA"));
    }

    @PostMapping("/{id}/pagar")
    @PreAuthorize("hasRole('USUARIO_GENERAL')")
    public ResponseEntity<Map<String,Object>> pagar(@AuthenticationPrincipal Long uid,
                                                    @PathVariable Long id) {
        service.pagar(id, uid);
        return ResponseEntity.ok(Map.of("idVenta", id, "estado", "PAGA"));
    }
}
