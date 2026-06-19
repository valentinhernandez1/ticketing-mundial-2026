package uy.edu.ucu.ticketing.domain;

import jakarta.persistence.*;
import lombok.*;
import java.time.OffsetDateTime;

@Entity @Table(name = "evento")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Evento {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_evento")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "id_estadio", nullable = false)
    private Estadio estadio;

    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "id_seleccion_local", nullable = false)
    private Seleccion local;

    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "id_seleccion_visitante", nullable = false)
    private Seleccion visitante;

    @Column(name = "fecha_hora_inicio", nullable = false)
    private OffsetDateTime fechaHoraInicio;

    @Column(name = "duracion_minutos", nullable = false)
    private Integer duracionMinutos;

    @Column(nullable = false) private String estado;

    @Column(name = "id_administrador", nullable = false)
    private Long idAdministrador;
}
