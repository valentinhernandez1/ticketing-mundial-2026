package uy.edu.ucu.ticketing.domain;

import jakarta.persistence.*;
import lombok.*;
import java.time.OffsetDateTime;

@Entity @Table(name = "usuario_general")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class UsuarioGeneral {
    @Id @Column(name = "id_usuario")
    private Long id;                 // comparte la PK con Usuario

    @OneToOne @MapsId
    @JoinColumn(name = "id_usuario")
    private Usuario usuario;

    @Column(name = "fecha_registro")
    private OffsetDateTime fechaRegistro;

    @Column(name = "identidad_verificada")
    private boolean identidadVerificada;
}
