package uy.edu.ucu.ticketing.model;

import lombok.*;
import uy.edu.ucu.ticketing.model.enums.ResultadoValidacion;
import java.time.OffsetDateTime;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Validacion {
    private Long id;
    private Long idEntrada;
    private Long idToken;
    private Long idFuncionario;
    private Long idDispositivo;
    private OffsetDateTime fechaHora;
    private String codigoQrValidado;
    private ResultadoValidacion resultado;
}
