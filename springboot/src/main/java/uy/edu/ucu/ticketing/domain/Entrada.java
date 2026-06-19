package uy.edu.ucu.ticketing.domain;

import jakarta.persistence.*;
import lombok.*;
import uy.edu.ucu.ticketing.domain.enums.EstadoEntrada;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity @Table(name = "entrada")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Entrada {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_entrada")
    private Long id;

    @Column(name = "codigo_unico", updatable = false, insertable = false)
    private UUID codigoUnico;

    @Column(name = "id_venta", nullable = false) private Long idVenta;
    @Column(name = "id_evento_sector", nullable = false) private Long idEventoSector;
    @Column(name = "id_usuario_actual", nullable = false) private Long idUsuarioActual;
    @Column(name = "fecha_emision") private OffsetDateTime fechaEmision;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, columnDefinition = "dom_estado_entrada")
    private EstadoEntrada estado;

    @Column(nullable = false) private BigDecimal precio;
    @Column(name = "cantidad_transferencias") private Integer cantidadTransferencias;
}
