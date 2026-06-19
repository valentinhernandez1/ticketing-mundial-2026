package uy.edu.ucu.ticketing.domain;

import lombok.*;
import java.time.OffsetDateTime;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Usuario {
    private Long id;
    private String email;
    private String nombre;
    private String apellido;
    private Long idDireccion;
    private OffsetDateTime fechaAlta;

    @com.fasterxml.jackson.annotation.JsonIgnore
    private String passwordHash;
}
