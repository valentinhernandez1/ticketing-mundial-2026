package uy.edu.ucu.ticketing.model;

import lombok.*;
import uy.edu.ucu.ticketing.model.enums.EstadoEntrada;
import uy.edu.ucu.ticketing.model.enums.EstadoVenta;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Entrada {
    private Long id;
    private UUID codigoUnico;
    private Long idVenta;
    private Long idEventoSector;
    private Long idUsuarioActual;
    private OffsetDateTime fechaEmision;
    private EstadoEntrada estado;
    private BigDecimal precio;
    private Integer cantidadTransferencias;
    private TokenQr tokenActivo;
    private EstadoVenta estadoVenta;
}
