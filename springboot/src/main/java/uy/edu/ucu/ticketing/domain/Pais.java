package uy.edu.ucu.ticketing.domain;

import lombok.Data;

@Data
public class Pais {
    private Integer idPais;
    private String codigoIso;
    private String nombre;
}
