package uy.edu.ucu.ticketing.dto;

import jakarta.validation.constraints.*;
import java.util.List;

/** Compra: hasta 5 evento_sector (uno por entrada). El comprador sale del token. */
public record CompraRequest(
        @NotEmpty @Size(max = 5, message = "Maximo 5 entradas por compra")
        List<Long> eventoSectores
) {}
