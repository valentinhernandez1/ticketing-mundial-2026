package uy.edu.ucu.ticketing.domain;

import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Estadio {
    private Long id;
    private String nombre;
    private Integer idPais;
    private String ciudad;
    private String direccion;
}
