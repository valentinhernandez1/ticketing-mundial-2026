package uy.edu.ucu.ticketing.model;

import lombok.*;
import java.time.OffsetDateTime;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Evento {
    private Long id;
    private Long idEstadio;
    private Long idSeleccionLocal;
    private Long idSeleccionVisitante;
    private OffsetDateTime fechaHoraInicio;
    private Integer duracionMinutos;
    private String estado;
    private Long idAdministrador;
}
