package uy.edu.ucu.ticketing.controller;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import uy.edu.ucu.ticketing.dto.TelefonoRequest;
import java.util.List;
import java.util.Map;

/**
 * Gestion de telefonos del usuario general (multivaluado 1:N).
 * Requerimiento de la consigna: el registro debe admitir multiples telefonos.
 */
@RestController
@RequestMapping("/api/usuarios/{id}/telefonos")
@PreAuthorize("hasRole('USUARIO_GENERAL')")
public class TelefonoController {

    @PersistenceContext
    private EntityManager em;

    private void verificarPropietario(Long id, Long uid) {
        if (!id.equals(uid)) {
            throw new AccessDeniedException("No puede gestionar telefonos de otro usuario");
        }
    }

    /** Lista los telefonos del usuario autenticado. */
    @GetMapping
    public List<Object[]> listar(@PathVariable Long id, @AuthenticationPrincipal Long uid) {
        verificarPropietario(id, uid);
        return em.createNativeQuery(
                "SELECT id_telefono, numero, tipo FROM telefono WHERE id_usuario = :id ORDER BY id_telefono")
                .setParameter("id", id)
                .getResultList();
    }

    /** Agrega un telefono al usuario autenticado. */
    @PostMapping
    @Transactional
    public ResponseEntity<Map<String, Object>> agregar(@PathVariable Long id,
                                                        @AuthenticationPrincipal Long uid,
                                                        @Valid @RequestBody TelefonoRequest req) {
        verificarPropietario(id, uid);

        Object idTelefono = em.createNativeQuery(
                "INSERT INTO telefono(id_usuario, numero, tipo) VALUES (:uid, :numero, :tipo) RETURNING id_telefono")
                .setParameter("uid", id)
                .setParameter("numero", req.numero())
                .setParameter("tipo", req.tipoEfectivo())
                .getSingleResult();

        return ResponseEntity.ok(Map.of("idTelefono", idTelefono, "numero", req.numero(), "tipo", req.tipoEfectivo()));
    }

    /** Elimina un telefono del usuario autenticado. */
    @DeleteMapping("/{idTelefono}")
    @Transactional
    public ResponseEntity<Map<String, Object>> eliminar(@PathVariable Long id,
                                                         @AuthenticationPrincipal Long uid,
                                                         @PathVariable Long idTelefono) {
        verificarPropietario(id, uid);
        int borrados = em.createNativeQuery(
                "DELETE FROM telefono WHERE id_telefono = :idTel AND id_usuario = :uid")
                .setParameter("idTel", idTelefono)
                .setParameter("uid", id)
                .executeUpdate();
        if (borrados == 0) {
            throw new jakarta.persistence.EntityNotFoundException("Telefono no encontrado o no pertenece al usuario");
        }
        return ResponseEntity.ok(Map.of("eliminado", true));
    }
}
