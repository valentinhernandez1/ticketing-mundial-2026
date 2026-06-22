package uy.edu.ucu.ticketing.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import uy.edu.ucu.ticketing.dto.ConsultaDtos.*;
import uy.edu.ucu.ticketing.repository.ConsultaRepository;
import uy.edu.ucu.ticketing.repository.EventoRepository;
import uy.edu.ucu.ticketing.repository.EventoSectorRepository;
import uy.edu.ucu.ticketing.repository.SectorRepository;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class ConsultaService {

    private final ConsultaRepository consultaRepo;
    private final EventoRepository eventoRepo;
    private final EventoSectorRepository eventoSectorRepo;
    private final SectorRepository sectorRepo;

    public ConsultaService(ConsultaRepository consultaRepo, EventoRepository eventoRepo,
                           EventoSectorRepository eventoSectorRepo, SectorRepository sectorRepo) {
        this.consultaRepo = consultaRepo;
        this.eventoRepo = eventoRepo;
        this.eventoSectorRepo = eventoSectorRepo;
        this.sectorRepo = sectorRepo;
    }

    private static long num(Object o) { return o == null ? 0L : ((Number) o).longValue(); }
    private static String str(Object o) { return o == null ? "" : o.toString(); }

    @Transactional(readOnly = true)
    public List<EventoDisp> eventosDisponibles() {
        List<Map<String, Object>> evs = eventoRepo.disponibles();
        List<EventoDisp> resultado = new ArrayList<>();

        for (Map<String, Object> ev : evs) {
            Long idEvento = num(ev.get("id_evento"));

            List<SectorDisp> sectores = eventoSectorRepo.sectoresPorEvento(idEvento).stream()
                    .map(s -> {
                        long cupo = num(s.get("cupo_habilitado"));
                        long vendidas = num(s.get("vendidas"));
                        return new SectorDisp(num(s.get("id_evento_sector")), str(s.get("sector")),
                                (BigDecimal) s.get("precio"), cupo, vendidas, Math.max(0, cupo - vendidas));
                    }).toList();

            resultado.add(new EventoDisp(idEvento, num(ev.get("id_estadio")),
                    str(ev.get("local")), str(ev.get("visitante")), str(ev.get("estadio")),
                    str(ev.get("fecha")), str(ev.get("estado")), sectores));
        }

        return resultado;
    }

    @Transactional(readOnly = true)
    public Catalogos catalogos() {
        List<Item> paises = consultaRepo.paisesSede().stream()
                .map(r -> new Item(num(r.get("id_pais")), str(r.get("nombre")))).toList();
        List<Item> selecciones = consultaRepo.selecciones().stream()
                .map(r -> new Item(num(r.get("id_seleccion")), str(r.get("nombre")))).toList();
        List<Item> estadios = consultaRepo.estadios().stream()
                .map(r -> new Item(num(r.get("id_estadio")), str(r.get("nombre")))).toList();
        return new Catalogos(paises, selecciones, estadios);
    }

    @Transactional(readOnly = true)
    public List<Item> sectoresDeEstadio(Long idEstadio) {
        return sectorRepo.sectoresDeEstadio(idEstadio).stream()
                .map(r -> new Item(num(r.get("id_sector")), str(r.get("nombre")))).toList();
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> funcionarios() {
        return consultaRepo.funcionarios();
    }

}
