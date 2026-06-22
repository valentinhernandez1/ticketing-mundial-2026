package uy.edu.ucu.ticketing.service;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import uy.edu.ucu.ticketing.dto.AdminDtos.*;
import uy.edu.ucu.ticketing.repository.EstadioRepository;
import uy.edu.ucu.ticketing.repository.EventoRepository;
import uy.edu.ucu.ticketing.repository.EventoSectorRepository;
import uy.edu.ucu.ticketing.repository.SectorRepository;
import uy.edu.ucu.ticketing.repository.UsuarioRepository;

import java.sql.Timestamp;

@Service
public class AdminService {

    private final EstadioRepository estadioRepo;
    private final SectorRepository sectorRepo;
    private final EventoRepository eventoRepo;
    private final EventoSectorRepository eventoSectorRepo;
    private final UsuarioRepository usuarioRepo;

    public AdminService(EstadioRepository estadioRepo, SectorRepository sectorRepo,
                        EventoRepository eventoRepo, EventoSectorRepository eventoSectorRepo,
                        UsuarioRepository usuarioRepo) {
        this.estadioRepo = estadioRepo;
        this.sectorRepo = sectorRepo;
        this.eventoRepo = eventoRepo;
        this.eventoSectorRepo = eventoSectorRepo;
        this.usuarioRepo = usuarioRepo;
    }

    private Integer verificarJurisdiccionEstadio(Long idAdmin, Long idEstadio) {
        Integer paisAdmin = usuarioRepo.paisDelAdmin(idAdmin)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "No sos administrador"));

        Integer paisEstadio = estadioRepo.paisDel(idEstadio)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Estadio no encontrado"));

        if (!paisAdmin.equals(paisEstadio))
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Solo podés gestionar estadios de tu país sede");

        return paisAdmin;
    }

    @Transactional
    public Long crearEstadio(Long idAdmin, EstadioRequest req) {
        Integer paisAdmin = usuarioRepo.paisDelAdmin(idAdmin)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "No sos administrador"));

        if (!paisAdmin.equals(req.idPais()))
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Solo podés crear estadios en tu país sede");

        return estadioRepo.insertar(req.nombre(), req.idPais(), req.ciudad(), req.direccion());
    }

    @Transactional
    public Long agregarSector(Long idAdmin, Long idEstadio, SectorRequest req) {
        verificarJurisdiccionEstadio(idAdmin, idEstadio);

        return sectorRepo.insertar(idEstadio, req.nombreSector(),
                req.capacidadMaxima(), req.precioBase());
    }

    @Transactional
    public Long crearEvento(Long idAdmin, EventoRequest req) {
        verificarJurisdiccionEstadio(idAdmin, req.idEstadio());

        // me fijo que el estadio no tenga otro evento en ese horario
        var fechaTs = req.fechaHoraInicio() == null ? null
                : Timestamp.from(req.fechaHoraInicio().toInstant());
        int duracion = req.duracionMinutos() != null ? req.duracionMinutos() : 120;

        if (eventoRepo.hayConflictoDeHorario(req.idEstadio(), fechaTs, duracion, null))
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Ya hay un evento en ese estadio en ese horario");

        return eventoRepo.insertar(idAdmin, req.idEstadio(),
                req.idSeleccionLocal(), req.idSeleccionVisitante(), fechaTs, duracion);
    }

    @Transactional
    public Long habilitarSector(Long idAdmin, Long idEvento, HabilitarSectorRequest req) {
        Integer paisAdmin = usuarioRepo.paisDelAdmin(idAdmin)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "No sos administrador"));
        Integer paisEvento = eventoRepo.paisDelEvento(idEvento)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Evento no encontrado"));

        if (!paisAdmin.equals(paisEvento))
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "El evento no es de tu jurisdicción");

        int capacidad = sectorRepo.capacidadMaxima(req.idSector())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Sector no encontrado"));

        if (req.cupo() > capacidad)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "El cupo (" + req.cupo() + ") no puede superar la capacidad del sector (" + capacidad + ")");

        return eventoSectorRepo.insertar(idEvento, req.idSector(), req.cupo(), req.precio());
    }

    @Transactional
    public void cancelarEvento(Long idAdmin, Long idEvento) {
        Integer paisAdmin = usuarioRepo.paisDelAdmin(idAdmin)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "No sos administrador"));
        Integer paisEvento = eventoRepo.paisDelEvento(idEvento)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Evento no encontrado"));

        if (!paisAdmin.equals(paisEvento))
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "El evento no es de tu jurisdicción");

        eventoRepo.cancelar(idEvento);
    }
}
