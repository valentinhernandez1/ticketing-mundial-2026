package uy.edu.ucu.ticketing.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import uy.edu.ucu.ticketing.service.EntradaService;

import java.util.Map;

@RestController
@RequestMapping("/api/entradas")
public class EntradaTokenController {

    private final EntradaService entradaService;

    public EntradaTokenController(EntradaService entradaService) {
        this.entradaService = entradaService;
    }

    @PostMapping("/{id}/token")
    @PreAuthorize("hasRole('USUARIO_GENERAL')")
    public ResponseEntity<Map<String, Object>> generarToken(@PathVariable Long id,
                                                             @AuthenticationPrincipal Long uid) {
        return ResponseEntity.ok(entradaService.generarToken(id, uid));
    }
}
