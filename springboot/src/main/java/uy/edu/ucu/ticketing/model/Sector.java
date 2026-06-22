package uy.edu.ucu.ticketing.model;

import lombok.*;
import java.math.BigDecimal;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Sector {
    private Long id;
    private Long idEstadio;
    private String nombreSector;
    private Integer capacidadMaxima;
    private BigDecimal precioBase;
}
