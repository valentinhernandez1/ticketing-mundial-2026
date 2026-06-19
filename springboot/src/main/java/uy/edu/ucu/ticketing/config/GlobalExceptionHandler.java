package uy.edu.ucu.ticketing.config;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;
import jakarta.persistence.EntityNotFoundException;
import jakarta.persistence.PersistenceException;
import java.util.Map;

/**
 * Traduce las excepciones de negocio lanzadas por los triggers / constraints
 * de PostgreSQL (RAISE EXCEPTION) a respuestas HTTP 400 con mensaje claro.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler({DataIntegrityViolationException.class, PersistenceException.class})
    public ResponseEntity<Map<String,String>> reglaNegocio(Exception ex) {
        Throwable root = ex;
        while (root.getCause() != null) root = root.getCause();
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("error", "REGLA_NEGOCIO", "detalle", root.getMessage()));
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<Map<String,String>> credenciales(BadCredentialsException ex) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("error", "NO_AUTORIZADO", "detalle", ex.getMessage()));
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<Map<String,String>> accesoDenegado(AccessDeniedException ex) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(Map.of("error", "ACCESO_DENEGADO", "detalle", ex.getMessage()));
    }

    @ExceptionHandler(EntityNotFoundException.class)
    public ResponseEntity<Map<String,String>> noEncontrado(EntityNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.of("error", "NO_ENCONTRADO", "detalle", ex.getMessage()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String,String>> validacion(MethodArgumentNotValidException ex) {
        String msg = ex.getBindingResult().getFieldErrors().stream()
                .findFirst().map(e -> e.getField() + ": " + e.getDefaultMessage())
                .orElse("Datos invalidos");
        return ResponseEntity.badRequest().body(Map.of("error", "VALIDACION", "detalle", msg));
    }
}
