package uy.edu.ucu.ticketing.domain;

import jakarta.persistence.*;
import lombok.*;
import uy.edu.ucu.ticketing.domain.enums.EstadoVenta;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Entity @Table(name = "venta")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Venta {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_venta")
    private Long id;

    @Column(name = "id_usuario", nullable = false) private Long idUsuario;
    @Column(nullable = false) private OffsetDateTime fecha;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, columnDefinition = "dom_estado_venta")
    private EstadoVenta estado;
    @Column(name = "id_comision") private Long idComision;
    @Column(name = "porcentaje_aplicado") private BigDecimal porcentajeAplicado;
    private BigDecimal subtotal;
    @Column(name = "monto_comision") private BigDecimal montoComision;
    @Column(name = "monto_total") private BigDecimal montoTotal;
}
