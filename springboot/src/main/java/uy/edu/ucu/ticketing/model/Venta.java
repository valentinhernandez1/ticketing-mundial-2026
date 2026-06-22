package uy.edu.ucu.ticketing.model;

import lombok.*;
import uy.edu.ucu.ticketing.model.enums.EstadoVenta;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Venta {
    private Long id;
    private Long idUsuario;
    private OffsetDateTime fecha;
    private EstadoVenta estado;
    private Long idComision;
    private BigDecimal porcentajeAplicado;
    private BigDecimal subtotal;
    private BigDecimal montoComision;
    private BigDecimal montoTotal;
}
