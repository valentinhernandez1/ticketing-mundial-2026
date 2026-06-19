package uy.edu.ucu.ticketing.domain;

import jakarta.persistence.*;
import lombok.*;
import java.time.OffsetDateTime;

@Entity @Table(name = "usuario")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Usuario {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_usuario")
    private Long id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false) private String nombre;
    @Column(nullable = false) private String apellido;

    @Column(name = "id_direccion", nullable = false)
    private Long idDireccion;

    @Column(name = "fecha_alta")
    private OffsetDateTime fechaAlta;

    /** Hash bcrypt almacenado en la BD. Nunca se serializa al JSON de respuesta. */
    @Column(name = "password_hash", nullable = false)
    @com.fasterxml.jackson.annotation.JsonIgnore
    private String passwordHash;
}
