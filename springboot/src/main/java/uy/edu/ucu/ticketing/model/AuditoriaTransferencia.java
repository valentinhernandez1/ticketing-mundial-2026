package uy.edu.ucu.ticketing.model;

import lombok.Data;
import java.time.OffsetDateTime;

@Data
public class AuditoriaTransferencia {
    private Long idAuditoria;
    private Long idTransferencia;
    private Long idEntrada;
    private Long idUsuarioOrigen;
    private Long idUsuarioDestino;
    private String estadoAnterior;
    private String estadoNuevo;
    private String accion;
    private String usuarioBd;
    private OffsetDateTime fechaEvento;
}
