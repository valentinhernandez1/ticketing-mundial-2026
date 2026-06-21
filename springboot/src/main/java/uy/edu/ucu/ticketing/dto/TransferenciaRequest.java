package uy.edu.ucu.ticketing.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record TransferenciaRequest(
        @NotNull Long idEntrada,
        @NotBlank @Email String emailDestino
) {}
