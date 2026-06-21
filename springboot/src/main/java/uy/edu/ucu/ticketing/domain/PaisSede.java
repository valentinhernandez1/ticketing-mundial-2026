package uy.edu.ucu.ticketing.domain;

import lombok.Data;
import java.time.LocalDate;

@Data
public class PaisSede {
    private Integer idPais;
    private LocalDate fechaAltaSede;
}
