package uy.edu.ucu.ticketing.config;

import org.springframework.dao.DataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(DataAccessException.class)
    public ResponseEntity<Map<String, String>> reglaNegocio(DataAccessException ex) {
        String raw = ex.getMostSpecificCause().getMessage();
        String detalle = traducirError(raw);
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(Map.of("error", "REGLA_NEGOCIO", "detalle", detalle));
    }

    private String traducirError(String msg) {
        if (msg == null) return "Error de base de datos";
        if (msg.contains("uq_sector"))            return "Ese sector ya existe en el estadio";
        if (msg.contains("uq_evento_sector"))     return "Ese sector ya está habilitado para este evento";
        if (msg.contains("uq_documento_nat"))     return "Ya existe un usuario con ese documento";
        if (msg.contains("uq_usuario_email"))     return "Ya existe una cuenta con ese email";
        if (msg.contains("uq_funcionario_legajo")) return "Ya existe un funcionario con ese número de legajo";
        if (msg.contains("uq_asignacion"))        return "El funcionario ya está asignado a ese sector en este evento";
        if (msg.contains("uq_token_activo"))      return "Ya hay un token activo para esta entrada";
        if (msg.contains("uq_validacion_aceptada")) return "Esta entrada ya fue validada";
        if (msg.contains("uq_dispositivo_fisico")) return "Ya existe un dispositivo con ese identificador";
        if (msg.contains("ex_evento_solape"))     return "Ya hay un evento en ese estadio en ese horario";
        if (msg.contains("ex_comision_vig"))      return "Ya hay una comisión vigente para ese período";
        if (msg.contains("ck_sector_nombre"))     return "El sector debe ser A, B, C o D";
        if (msg.contains("ck_entrada_transf"))    return "La entrada ya alcanzó el máximo de 3 transferencias";
        if (msg.contains("duplicate key"))        return "Ya existe un registro con esos datos";
        if (msg.contains("foreign key"))          return "No se puede realizar la operación: referencia inválida";
        if (msg.contains("violates check"))       return "Los datos no cumplen las reglas del sistema";
        // mensajes de RAISE EXCEPTION de los triggers, los paso directo
        return msg;
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<Map<String, String>> credenciales(BadCredentialsException ex) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("error", "NO_AUTORIZADO", "detalle", ex.getMessage()));
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<Map<String, String>> accesoDenegado(AccessDeniedException ex) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(Map.of("error", "ACCESO_DENEGADO", "detalle", ex.getMessage()));
    }

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, String>> responseStatus(ResponseStatusException ex) {
        return ResponseEntity.status(ex.getStatusCode())
                .body(Map.of("error", ex.getStatusCode().toString(), "detalle", ex.getReason() != null ? ex.getReason() : ex.getMessage()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> validacion(MethodArgumentNotValidException ex) {
        String msg = ex.getBindingResult().getFieldErrors().stream()
                .findFirst().map(e -> e.getField() + ": " + e.getDefaultMessage())
                .orElse("Datos invalidos");
        return ResponseEntity.badRequest().body(Map.of("error", "VALIDACION", "detalle", msg));
    }
}
