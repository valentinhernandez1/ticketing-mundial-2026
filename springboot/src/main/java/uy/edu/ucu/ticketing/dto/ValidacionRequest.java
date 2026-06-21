package uy.edu.ucu.ticketing.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

// el QR codifica "{idEntrada}:{codigoToken}" — el backend lo parsea // ver bien me faltan cosas analizar 
public record ValidacionRequest(
        @NotBlank String codigoQr,
        @NotNull Long idDispositivo
) 
{

}
