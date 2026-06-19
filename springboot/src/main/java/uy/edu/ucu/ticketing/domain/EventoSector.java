package uy.edu.ucu.ticketing.domain;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;

@Entity @Table(name = "evento_sector")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class EventoSector {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_evento_sector")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "id_evento", nullable = false)
    private Evento evento;

    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "id_sector", nullable = false)
    private Sector sector;

    @Column(name = "cupo_habilitado", nullable = false) private Integer cupoHabilitado;
    @Column(nullable = false) private BigDecimal precio;
}
