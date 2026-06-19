package uy.edu.ucu.ticketing.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record TelefonoRequest(
        @NotBlank String numero,
        @Pattern(regexp = "MOVIL|FIJO|TRABAJO|OTRO", message = "tipo debe ser MOVIL, FIJO, TRABAJO u OTRO")
        String tipo
) {
    /** Si el cliente no manda tipo, se asume MOVIL (mismo default que la BD). */
    public String tipoEfectivo() {
        return (tipo == null || tipo.isBlank()) ? "MOVIL" : tipo;
    }
}
