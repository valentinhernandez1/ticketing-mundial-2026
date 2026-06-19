package uy.edu.ucu.ticketing.domain;

import jakarta.persistence.*;
import lombok.*;

@Entity @Table(name = "estadio")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Estadio {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_estadio")
    private Long id;
    @Column(nullable = false) private String nombre;
    @Column(name = "id_pais", nullable = false) private Integer idPais;
    @Column(nullable = false) private String ciudad;
    @Column(nullable = false) private String direccion;
}
