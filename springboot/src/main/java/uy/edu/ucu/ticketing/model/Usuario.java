package uy.edu.ucu.ticketing.model;

import lombok.*;
import java.time.OffsetDateTime;
import java.util.List;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Usuario {
    private Long id;
    private String email;
    private String nombre;
    private String apellido;
    private Long idDireccion;
    private Direccion direccion;
    private Documento documento;
    private OffsetDateTime fechaAlta;
    private List<Telefono> telefonos;

    @com.fasterxml.jackson.annotation.JsonIgnore
    private String passwordHash;
}
