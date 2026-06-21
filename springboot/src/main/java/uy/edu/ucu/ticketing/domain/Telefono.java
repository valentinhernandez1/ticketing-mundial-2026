package uy.edu.ucu.ticketing.domain;

import lombok.Data;

@Data
public class Telefono {
    private Long idTelefono;
    private Long idUsuario;
    private String numero;
    private String tipo;
}
