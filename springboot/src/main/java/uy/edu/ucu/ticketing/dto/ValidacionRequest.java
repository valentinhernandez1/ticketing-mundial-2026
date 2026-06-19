package uy.edu.ucu.ticketing.dto;

import jakarta.validation.constraints.NotNull;

/** El funcionario que valida sale del token (no del body). */
public record ValidacionRequest(
        @NotNull Long idEntrada,
        @NotNull Long idToken,
        @NotNull Long idDispositivo
) {}
