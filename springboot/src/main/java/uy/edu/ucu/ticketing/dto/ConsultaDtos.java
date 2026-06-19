package uy.edu.ucu.ticketing.dto;

import java.math.BigDecimal;
import java.util.List;

/** DTOs de solo lectura para alimentar el frontend (catalogos y disponibilidad). */
public class ConsultaDtos {

    public record SectorDisp(Long idEventoSector, String sector, BigDecimal precio,
                             long cupo, long vendidas, long disponibles) {}

    public record EventoDisp(Long idEvento, Long idEstadio, String local, String visitante,
                             String estadio, String fecha, String estado, List<SectorDisp> sectores) {}

    /** Item generico id+nombre para los <select> del alta de eventos. */
    public record Item(Long id, String nombre) {}

    public record Catalogos(List<Item> paisesSede, List<Item> selecciones, List<Item> estadios) {}

    public record TokenResp(String codigo, String expira) {}
}
