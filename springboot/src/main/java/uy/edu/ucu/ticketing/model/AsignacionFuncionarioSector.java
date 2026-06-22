package uy.edu.ucu.ticketing.model;

import lombok.Data;

@Data
public class AsignacionFuncionarioSector {
    private Long idAsignacion;
    private Long idFuncionario;
    private Long idEvento;
    private Long idSector;
}
