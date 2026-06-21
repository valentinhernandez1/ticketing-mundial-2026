package uy.edu.ucu.ticketing.controller;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import uy.edu.ucu.ticketing.dto.TelefonoRequest;
import uy.edu.ucu.ticketing.service.TelefonoService;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/usuarios/{id}/telefonos")
@PreAuthorize("hasRole('USUARIO_GENERAL')")
public class TelefonoController {

    private final TelefonoService telefonoService;

    public TelefonoController(TelefonoService telefonoService) {
        this.telefonoService = telefonoService;
    }

    @GetMapping
    public List<Map<String, Object>> listar(@PathVariable Long id, @AuthenticationPrincipal Long uid) {
        return telefonoService.listar(id, uid);
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> agregar(@PathVariable Long id,
                                                        @AuthenticationPrincipal Long uid,
                                                        @Valid @RequestBody TelefonoRequest req) {
        return ResponseEntity.ok(telefonoService.agregar(id, uid, req));
    }

    @DeleteMapping("/{idTelefono}")
    public ResponseEntity<Map<String, Object>> eliminar(@PathVariable Long id,
                                                         @AuthenticationPrincipal Long uid,
                                                         @PathVariable Long idTelefono) {
        telefonoService.eliminar(id, uid, idTelefono);
        return ResponseEntity.ok(Map.of("eliminado", true));
    }
}
