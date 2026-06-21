package uy.edu.ucu.ticketing.domain;

import lombok.Data;
import java.time.OffsetDateTime;

@Data
public class TokenQr {
    private Long idToken;
    private Long idEntrada;
    private String codigoToken;
    private OffsetDateTime fechaGeneracion;
    private OffsetDateTime fechaExpiracion;
    private Boolean activo;
}
