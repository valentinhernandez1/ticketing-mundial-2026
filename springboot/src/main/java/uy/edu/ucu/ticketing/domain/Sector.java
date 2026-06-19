package uy.edu.ucu.ticketing.domain;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;

@Entity @Table(name = "sector")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Sector {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_sector")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_estadio", nullable = false)
    private Estadio estadio;

    @Column(name = "nombre_sector", nullable = false) private String nombreSector;
    @Column(name = "capacidad_maxima", nullable = false) private Integer capacidadMaxima;
    @Column(name = "precio_base", nullable = false) private BigDecimal precioBase;
}
