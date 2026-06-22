package uy.edu.ucu.ticketing.model;

import lombok.Data;

@Data
public class Direccion {
    private Long idDireccion;
    private Integer idPais;
    private String localidad;
    private String calle;
    private String numero;
    private String codigoPostal;
}
