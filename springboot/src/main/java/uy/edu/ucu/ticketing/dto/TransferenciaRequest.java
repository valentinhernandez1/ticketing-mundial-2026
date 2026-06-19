package uy.edu.ucu.ticketing.dto;

import jakarta.validation.constraints.NotNull;

public record TransferenciaRequest(
        @NotNull Long idEntrada,
        @NotNull String emailDestino
) {}
