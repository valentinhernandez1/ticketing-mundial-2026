package uy.edu.ucu.ticketing.domain;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity @Table(name = "administrador_pais")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AdministradorPais {
    @Id @Column(name = "id_usuario")
    private Long id;

    @OneToOne @MapsId @JoinColumn(name = "id_usuario")
    private Usuario usuario;

    @Column(name = "fecha_asignacion")
    private LocalDate fechaAsignacion;

    @Column(name = "id_pais", nullable = false)
    private Integer idPais;          // jurisdiccion (pais sede)
}
