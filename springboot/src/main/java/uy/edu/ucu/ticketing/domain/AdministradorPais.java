package uy.edu.ucu.ticketing.domain;

import lombok.*;
import java.time.LocalDate;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AdministradorPais {
    private Long id;
    private LocalDate fechaAsignacion;
    private Integer idPais;
}
