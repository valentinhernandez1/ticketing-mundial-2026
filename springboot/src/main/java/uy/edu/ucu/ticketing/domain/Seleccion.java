package uy.edu.ucu.ticketing.domain;

import jakarta.persistence.*;
import lombok.*;

@Entity @Table(name = "seleccion")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Seleccion {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_seleccion")
    private Long id;
    @Column(nullable = false, unique = true) private String nombre;
    @Column(name = "codigo_fifa", nullable = false, unique = true) private String codigoFifa;
}
