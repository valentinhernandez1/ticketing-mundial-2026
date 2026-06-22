package uy.edu.ucu.ticketing.model;

import lombok.*;
import uy.edu.ucu.ticketing.model.enums.EstadoTransferencia;
import java.time.OffsetDateTime;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Transferencia {
    private Long id;
    private Long idEntrada;
    private Long idUsuarioOrigen;
    private Long idUsuarioDestino;
    private OffsetDateTime fechaTransferencia;
    private OffsetDateTime fechaAceptacion;
    private EstadoTransferencia estado;
}
