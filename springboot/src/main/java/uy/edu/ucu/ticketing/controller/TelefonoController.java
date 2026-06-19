package uy.edu.ucu.ticketing.controller;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import uy.edu.ucu.ticketing.dto.TelefonoRequest;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/usuarios/{id}/telefonos")
@PreAuthorize("hasRole('USUARIO_GENERAL')")
public class TelefonoController {

    private final JdbcTemplate jdbc;

    public TelefonoController(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    private void verificarPropietario(Long id, Long uid) {
        if (!id.equals(uid)) {
            throw new AccessDeniedException("No puede gestionar telefonos de otro usuario");
        }
    }

    @GetMapping
    public List<Map<String, Object>> listar(@PathVariable Long id, @AuthenticationPrincipal Long uid) {
        verificarPropietario(id, uid);
        return jdbc.queryForList(
                "SELECT id_telefono, numero, tipo FROM telefono WHERE id_usuario = ? ORDER BY id_telefono", id);
    }

    @PostMapping
    @Transactional
    public ResponseEntity<Map<String, Object>> agregar(@PathVariable Long id,
                                                        @AuthenticationPrincipal Long uid,
                                                        @Valid @RequestBody TelefonoRequest req) {
        verificarPropietario(id, uid);
        String tipo = req.tipoEfectivo();
        Long idTelefono = jdbc.queryForObject(
                "INSERT INTO telefono(id_usuario, numero, tipo) VALUES (?, ?, ?) RETURNING id_telefono",
                Long.class, id, req.numero(), tipo);
        return ResponseEntity.ok(Map.of("idTelefono", idTelefono, "numero", req.numero(), "tipo", tipo));
    }

    @DeleteMapping("/{idTelefono}")
    @Transactional
    public ResponseEntity<Map<String, Object>> eliminar(@PathVariable Long id,
                                                         @AuthenticationPrincipal Long uid,
                                                         @PathVariable Long idTelefono) {
        verificarPropietario(id, uid);
        int borrados = jdbc.update(
                "DELETE FROM telefono WHERE id_telefono = ? AND id_usuario = ?", idTelefono, id);
        if (borrados == 0) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND,
                    "Telefono no encontrado o no pertenece al usuario");
        }
        return ResponseEntity.ok(Map.of("eliminado", true));
    }
}
