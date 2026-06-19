package uy.edu.ucu.ticketing.controller;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import uy.edu.ucu.ticketing.dto.TransferenciaRequest;
import uy.edu.ucu.ticketing.service.TransferenciaService;
import java.util.Map;

@RestController
@RequestMapping("/api/transferencias")
public class TransferenciaController {

    private final TransferenciaService service;
    public TransferenciaController(TransferenciaService service) { this.service = service; }

    @PostMapping
    public ResponseEntity<Map<String,Object>> iniciar(@AuthenticationPrincipal Long uid,
                                                      @Valid @RequestBody TransferenciaRequest req) {
        return ResponseEntity.ok(Map.of("idTransferencia", service.iniciar(uid, req), "estado", "PENDIENTE"));
    }

    @PostMapping("/{id}/aceptar")
    public ResponseEntity<Map<String,Object>> aceptar(@AuthenticationPrincipal Long uid,
                                                      @PathVariable Long id) {
        service.aceptar(id, uid);
        return ResponseEntity.ok(Map.of("idTransferencia", id, "estado", "ACEPTADA"));
    }

    @PostMapping("/{id}/rechazar")
    public ResponseEntity<Map<String,Object>> rechazar(@AuthenticationPrincipal Long uid,
                                                       @PathVariable Long id) {
        service.rechazar(id, uid);
        return ResponseEntity.ok(Map.of("idTransferencia", id, "estado", "RECHAZADA"));
    }
}
