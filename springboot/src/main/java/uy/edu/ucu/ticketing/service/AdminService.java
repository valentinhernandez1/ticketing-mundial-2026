package uy.edu.ucu.ticketing.service;

import jakarta.persistence.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import uy.edu.ucu.ticketing.dto.AdminDtos.*;

/**
 * Gestion de estadios y eventos (rol ADMINISTRADOR_PAIS). Toda la escritura
 * pasa por stored procedures: los triggers garantizan las reglas (periodo del
 * evento, anti-superposicion, cupo <= capacidad del sector).
 */
@Service
public class AdminService {

    @PersistenceContext
    private EntityManager em;

    @Transactional
    public Long crearEstadio(Long idAdmin, EstadioRequest req) {
        StoredProcedureQuery sp = em.createStoredProcedureQuery("sp_crear_estadio");
        sp.registerStoredProcedureParameter("p_id_administrador", Long.class,    ParameterMode.IN);
        sp.registerStoredProcedureParameter("p_nombre",     String.class,  ParameterMode.IN);
        sp.registerStoredProcedureParameter("p_id_pais",    Integer.class, ParameterMode.IN);
        sp.registerStoredProcedureParameter("p_ciudad",     String.class,  ParameterMode.IN);
        sp.registerStoredProcedureParameter("p_direccion",  String.class,  ParameterMode.IN);
        sp.registerStoredProcedureParameter("p_id_estadio", Long.class,    ParameterMode.OUT);
        sp.setParameter("p_id_administrador", idAdmin);
        sp.setParameter("p_nombre",    req.nombre());
        sp.setParameter("p_id_pais",   req.idPais());
        sp.setParameter("p_ciudad",    req.ciudad());
        sp.setParameter("p_direccion", req.direccion());
        sp.execute();
        return (Long) sp.getOutputParameterValue("p_id_estadio");
    }

    @Transactional
    public Long agregarSector(Long idAdmin, Long idEstadio, SectorRequest req) {
        StoredProcedureQuery sp = em.createStoredProcedureQuery("sp_agregar_sector");
        sp.registerStoredProcedureParameter("p_id_administrador", Long.class,            ParameterMode.IN);
        sp.registerStoredProcedureParameter("p_id_estadio",  Long.class,            ParameterMode.IN);
        sp.registerStoredProcedureParameter("p_nombre",      String.class,          ParameterMode.IN);
        sp.registerStoredProcedureParameter("p_capacidad",   Integer.class,         ParameterMode.IN);
        sp.registerStoredProcedureParameter("p_precio_base", java.math.BigDecimal.class, ParameterMode.IN);
        sp.registerStoredProcedureParameter("p_id_sector",   Long.class,            ParameterMode.OUT);
        sp.setParameter("p_id_administrador", idAdmin);
        sp.setParameter("p_id_estadio",  idEstadio);
        sp.setParameter("p_nombre",      req.nombreSector());
        sp.setParameter("p_capacidad",   req.capacidadMaxima());
        sp.setParameter("p_precio_base", req.precioBase());
        sp.execute();
        return (Long) sp.getOutputParameterValue("p_id_sector");
    }

    @Transactional
    public Long crearEvento(Long idAdmin, EventoRequest req) {
        StoredProcedureQuery sp = em.createStoredProcedureQuery("sp_crear_evento");
        sp.registerStoredProcedureParameter("p_id_administrador", Long.class,                  ParameterMode.IN);
        sp.registerStoredProcedureParameter("p_id_estadio",       Long.class,                  ParameterMode.IN);
        sp.registerStoredProcedureParameter("p_id_local",         Long.class,                  ParameterMode.IN);
        sp.registerStoredProcedureParameter("p_id_visitante",     Long.class,                  ParameterMode.IN);
        sp.registerStoredProcedureParameter("p_fecha_hora",       java.time.OffsetDateTime.class, ParameterMode.IN);
        sp.registerStoredProcedureParameter("p_duracion_minutos", Integer.class,               ParameterMode.IN);
        sp.registerStoredProcedureParameter("p_id_evento",        Long.class,                  ParameterMode.OUT);
        sp.setParameter("p_id_administrador", idAdmin);
        sp.setParameter("p_id_estadio",       req.idEstadio());
        sp.setParameter("p_id_local",         req.idSeleccionLocal());
        sp.setParameter("p_id_visitante",     req.idSeleccionVisitante());
        sp.setParameter("p_fecha_hora",       req.fechaHoraInicio());
        sp.setParameter("p_duracion_minutos", req.duracionMinutos());
        sp.execute();
        return (Long) sp.getOutputParameterValue("p_id_evento");
    }

    @Transactional
    public Long habilitarSector(Long idAdmin, Long idEvento, HabilitarSectorRequest req) {
        StoredProcedureQuery sp = em.createStoredProcedureQuery("sp_habilitar_sector");
        sp.registerStoredProcedureParameter("p_id_administrador", Long.class,                  ParameterMode.IN);
        sp.registerStoredProcedureParameter("p_id_evento",        Long.class,                  ParameterMode.IN);
        sp.registerStoredProcedureParameter("p_id_sector",        Long.class,                  ParameterMode.IN);
        sp.registerStoredProcedureParameter("p_cupo",             Integer.class,               ParameterMode.IN);
        sp.registerStoredProcedureParameter("p_precio",           java.math.BigDecimal.class,  ParameterMode.IN);
        sp.registerStoredProcedureParameter("p_id_evento_sector", Long.class,                  ParameterMode.OUT);
        sp.setParameter("p_id_administrador", idAdmin);
        sp.setParameter("p_id_evento", idEvento);
        sp.setParameter("p_id_sector", req.idSector());
        sp.setParameter("p_cupo",      req.cupo());
        sp.setParameter("p_precio",    req.precio());
        sp.execute();
        return (Long) sp.getOutputParameterValue("p_id_evento_sector");
    }

    @Transactional
    public void cancelarEvento(Long idAdmin, Long idEvento) {
        StoredProcedureQuery sp = em.createStoredProcedureQuery("sp_cancelar_evento");
        sp.registerStoredProcedureParameter("p_id_administrador", Long.class, ParameterMode.IN);
        sp.registerStoredProcedureParameter("p_id_evento", Long.class, ParameterMode.IN);
        sp.setParameter("p_id_administrador", idAdmin);
        sp.setParameter("p_id_evento", idEvento);
        sp.execute();
    }
}
