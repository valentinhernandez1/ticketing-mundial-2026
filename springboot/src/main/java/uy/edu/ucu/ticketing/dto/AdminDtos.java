package uy.edu.ucu.ticketing.dto;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

public class AdminDtos {

    public record EstadioRequest(
            @NotBlank String nombre,
            @NotNull Integer idPais,
            @NotBlank String ciudad,
            @NotBlank String direccion
    ) {}

    public record SectorRequest(
            @NotBlank @Pattern(regexp = "[ABCD]", message = "El sector debe ser A, B, C o D") String nombreSector,
            @NotNull @Positive Integer capacidadMaxima,
            @NotNull @PositiveOrZero BigDecimal precioBase
    ) {}

    public record EventoRequest(
            @NotNull Long idEstadio,
            @NotNull Long idSeleccionLocal,
            @NotNull Long idSeleccionVisitante,
            @NotNull OffsetDateTime fechaHoraInicio,
            @Positive Integer duracionMinutos   // si no viene, default 120
    ) {}

    public record HabilitarSectorRequest(
            @NotNull Long idSector,
            @NotNull @Positive Integer cupo,
            @NotNull @PositiveOrZero BigDecimal precio
    ) {}
}
