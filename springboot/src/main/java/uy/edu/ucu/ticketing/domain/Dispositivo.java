package uy.edu.ucu.ticketing.domain;

import lombok.*;
import java.time.OffsetDateTime;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Dispositivo {
    private Long id;
    private String identificadorFisico;
    private String estado;
    private OffsetDateTime fechaRegistro;
    private Long idFuncionario;
}
