package uy.edu.ucu.ticketing.model;

import lombok.*;
import java.time.OffsetDateTime;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class UsuarioGeneral {
    private Long id;
    private OffsetDateTime fechaRegistro;
    private boolean identidadVerificada;
}
