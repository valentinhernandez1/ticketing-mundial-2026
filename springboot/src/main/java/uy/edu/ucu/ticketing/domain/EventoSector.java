package uy.edu.ucu.ticketing.domain;

import lombok.*;
import java.math.BigDecimal;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class EventoSector {
    private Long id;
    private Long idEvento;
    private Long idSector;
    private Integer cupoHabilitado;
    private BigDecimal precio;
}
