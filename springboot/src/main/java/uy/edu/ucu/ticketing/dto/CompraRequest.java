package uy.edu.ucu.ticketing.dto;

import jakarta.validation.constraints.*;
import java.util.List;

// lista de id_evento_sector, máx 5 por compra
public record CompraRequest(
        @NotEmpty @Size(max = 5, message = "Maximo 5 entradas por compra")
        List<Long> eventoSectores
) {}
