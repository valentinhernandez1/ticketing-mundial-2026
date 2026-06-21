package uy.edu.ucu.ticketing.domain;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class Comision {
    private Long idComision;
    private BigDecimal porcentaje;
    private LocalDate fechaInicio;
    private LocalDate fechaFin;
}
