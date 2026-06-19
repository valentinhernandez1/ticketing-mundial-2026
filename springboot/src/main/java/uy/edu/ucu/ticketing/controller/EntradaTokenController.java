package uy.edu.ucu.ticketing.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import uy.edu.ucu.ticketing.repository.TokenRepository;

import java.util.Map;

@RestController
@RequestMapping("/api/entradas")
public class EntradaTokenController {

    private final TokenRepository tokenRepo;

    public EntradaTokenController(TokenRepository tokenRepo) {
        this.tokenRepo = tokenRepo;
    }

    @PostMapping("/{id}/token")
    @PreAuthorize("hasRole('USUARIO_GENERAL')")
    public ResponseEntity<Map<String, Object>> generarToken(@PathVariable Long id,
                                                             @AuthenticationPrincipal Long uid) {
        tokenRepo.findEntradaDeUsuario(id, uid)
                .filter(e -> !"CONSUMIDA".equals(e.get("estado")))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN,
                        "Esta entrada no es tuya o ya fue consumida"));
        return ResponseEntity.ok(tokenRepo.generarToken(id));
    }
}
