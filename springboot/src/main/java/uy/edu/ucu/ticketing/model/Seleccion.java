package uy.edu.ucu.ticketing.model;

import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Seleccion {
    private Long id;
    private String nombre;
    private String codigoFifa;
}
