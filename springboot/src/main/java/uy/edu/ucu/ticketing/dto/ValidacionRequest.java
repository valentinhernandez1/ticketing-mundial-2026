package uy.edu.ucu.ticketing.dto;

import jakarta.validation.constraints.NotNull;

// el QR codifica "{idEntrada}:{codigoToken}" — el backend lo parsea
public record ValidacionRequest(
        @NotNull String codigoQr,
        @NotNull Long idDispositivo
) {}
