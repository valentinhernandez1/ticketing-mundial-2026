package uy.edu.ucu.ticketing.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import uy.edu.ucu.ticketing.dto.ConsultaDtos.TokenResp;
import uy.edu.ucu.ticketing.service.ConsultaService;

/** Generacion del token QR dinamico de una entrada (rota cada ~30s). */
@RestController
@RequestMapping("/api/entradas")
public class EntradaTokenController {

    private final ConsultaService service;
    public EntradaTokenController(ConsultaService service) { this.service = service; }

    @PostMapping("/{id}/token")
    @PreAuthorize("hasRole('USUARIO_GENERAL')")
    public ResponseEntity<TokenResp> nuevoToken(@AuthenticationPrincipal Long uid,
                                                @PathVariable Long id) {
        return ResponseEntity.ok(service.generarToken(id, uid));
    }
}
