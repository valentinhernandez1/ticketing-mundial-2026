package uy.edu.ucu.ticketing.domain;

import jakarta.persistence.*;
import lombok.*;
import java.time.OffsetDateTime;

@Entity @Table(name = "validacion")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Validacion {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_validacion")
    private Long id;
    @Column(name = "id_entrada", nullable = false) private Long idEntrada;
    @Column(name = "id_token", nullable = false) private Long idToken;
    @Column(name = "id_funcionario", nullable = false) private Long idFuncionario;
    @Column(name = "id_dispositivo", nullable = false) private Long idDispositivo;
    @Column(name = "fecha_hora") private OffsetDateTime fechaHora;
    @Column(name = "codigo_qr_validado", nullable = false) private String codigoQrValidado;

    @Column(nullable = false, columnDefinition = "dom_resultado_val")
    private String resultado;
}
