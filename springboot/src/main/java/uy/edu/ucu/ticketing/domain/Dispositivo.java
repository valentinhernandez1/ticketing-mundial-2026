package uy.edu.ucu.ticketing.domain;

import jakarta.persistence.*;
import lombok.*;
import java.time.OffsetDateTime;

@Entity @Table(name = "dispositivo")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Dispositivo {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_dispositivo")
    private Long id;
    @Column(name = "identificador_fisico", nullable = false, unique = true) private String identificadorFisico;
    @Column(nullable = false) private String estado;
    @Column(name = "fecha_registro") private OffsetDateTime fechaRegistro;
    @Column(name = "id_funcionario", nullable = false) private Long idFuncionario;
}
