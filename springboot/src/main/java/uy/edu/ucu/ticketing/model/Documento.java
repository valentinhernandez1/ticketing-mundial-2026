package uy.edu.ucu.ticketing.model;

import lombok.Data;

@Data
public class Documento {
    private Long idDocumento;
    private Long idUsuario;
    private Integer idPais;
    private String tipoDocumento;
    private String numero;
}
