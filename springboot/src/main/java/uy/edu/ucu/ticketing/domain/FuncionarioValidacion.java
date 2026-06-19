package uy.edu.ucu.ticketing.domain;

import jakarta.persistence.*;
import lombok.*;

@Entity @Table(name = "funcionario_validacion")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class FuncionarioValidacion {
    @Id @Column(name = "id_usuario")
    private Long id;

    @OneToOne @MapsId @JoinColumn(name = "id_usuario")
    private Usuario usuario;

    @Column(name = "numero_legajo", nullable = false, unique = true)
    private String numeroLegajo;
}
