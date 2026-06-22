package uy.edu.ucu.ticketing.model;

import lombok.*;
import uy.edu.ucu.ticketing.model.enums.EstadoDispositivo;
import java.time.OffsetDateTime;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Dispositivo {
    private Long id;
    private String identificadorFisico;
    private EstadoDispositivo estado;
    private OffsetDateTime fechaRegistro;
    private Long idFuncionario;
}
