package uy.edu.ucu.ticketing.domain;

import jakarta.persistence.*;
import lombok.*;
import uy.edu.ucu.ticketing.domain.enums.EstadoTransferencia;
import java.time.OffsetDateTime;

@Entity @Table(name = "transferencia")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Transferencia {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_transferencia")
    private Long id;

    @Column(name = "id_entrada", nullable = false) private Long idEntrada;
    @Column(name = "id_usuario_origen", nullable = false) private Long idUsuarioOrigen;
    @Column(name = "id_usuario_destino", nullable = false) private Long idUsuarioDestino;
    @Column(name = "fecha_transferencia") private OffsetDateTime fechaTransferencia;
    @Column(name = "fecha_aceptacion") private OffsetDateTime fechaAceptacion;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, columnDefinition = "dom_estado_transf")
    private EstadoTransferencia estado;
}
