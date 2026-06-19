package uy.edu.ucu.ticketing.controller;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import uy.edu.ucu.ticketing.dto.ValidacionRequest;
import uy.edu.ucu.ticketing.service.ValidacionService;
import java.util.Map;

@RestController
@RequestMapping("/api/validaciones")
public class ValidacionController {

    private final ValidacionService service;
    public ValidacionController(ValidacionService service) { this.service = service; }

    @PostMapping
    @PreAuthorize("hasRole('FUNCIONARIO_VALIDACION')")
    public ResponseEntity<Map<String,Object>> validar(@AuthenticationPrincipal Long uid,
                                                      @Valid @RequestBody ValidacionRequest req) {
        String resultado = service.validar(uid, req);
        return ResponseEntity.ok(Map.of("resultado", resultado));
    }
}
