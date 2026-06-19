package uy.edu.ucu.ticketing.service;

import jakarta.persistence.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import uy.edu.ucu.ticketing.dto.ConsultaDtos.*;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

/**
 * Consultas de solo lectura para el frontend: eventos disponibles con su
 * ocupacion por sector, catalogos para los formularios de administracion y
 * generacion del token QR dinamico.
 */
@Service
public class ConsultaService {

    @PersistenceContext
    private EntityManager em;

    private static long asLong(Object o) { return ((Number) o).longValue(); }
    private static String asStr(Object o) { return o == null ? null : o.toString(); }

    /** Eventos PROGRAMADOS con sus sectores habilitados y disponibilidad. */
    @SuppressWarnings("unchecked")
    public List<EventoDisp> eventosDisponibles() {
        List<Object[]> evs = em.createNativeQuery("""
                SELECT ev.id_evento, ev.id_estadio, sl.nombre, sv.nombre, est.nombre,
                       to_char(ev.fecha_hora_inicio, 'YYYY-MM-DD HH24:MI'), ev.estado
                  FROM evento ev
                  JOIN seleccion sl ON sl.id_seleccion = ev.id_seleccion_local
                  JOIN seleccion sv ON sv.id_seleccion = ev.id_seleccion_visitante
                  JOIN estadio  est ON est.id_estadio  = ev.id_estadio
                 WHERE ev.estado = 'PROGRAMADO'
                 ORDER BY ev.fecha_hora_inicio
                """).getResultList();

        List<EventoDisp> out = new ArrayList<>();
        for (Object[] e : evs) {
            Long idEvento = asLong(e[0]);
            List<Object[]> secs = em.createNativeQuery("""
                    SELECT es.id_evento_sector, s.nombre_sector, es.precio, es.cupo_habilitado,
                           (SELECT COUNT(*) FROM entrada en
                             WHERE en.id_evento_sector = es.id_evento_sector AND en.estado <> 'ANULADA')
                      FROM evento_sector es
                      JOIN sector s ON s.id_sector = es.id_sector
                     WHERE es.id_evento = :idEvento
                     ORDER BY s.nombre_sector
                    """).setParameter("idEvento", idEvento).getResultList();

            List<SectorDisp> sectores = new ArrayList<>();
            for (Object[] s : secs) {
                long cupo = asLong(s[3]);
                long vendidas = asLong(s[4]);
                sectores.add(new SectorDisp(asLong(s[0]), asStr(s[1]), (BigDecimal) s[2],
                        cupo, vendidas, Math.max(0, cupo - vendidas)));
            }
            out.add(new EventoDisp(idEvento, asLong(e[1]), (String) e[2], (String) e[3],
                    (String) e[4], (String) e[5], (String) e[6], sectores));
        }
        return out;
    }

    /** Catalogos para los formularios del administrador. */
    @SuppressWarnings("unchecked")
    public Catalogos catalogos() {
        List<Item> paises = ((List<Object[]>) em.createNativeQuery("""
                SELECT p.id_pais, p.nombre FROM pais_sede ps
                  JOIN pais p ON p.id_pais = ps.id_pais ORDER BY p.nombre
                """).getResultList()).stream()
                .map(r -> new Item(asLong(r[0]), asStr(r[1]))).toList();

        List<Item> selecciones = ((List<Object[]>) em.createNativeQuery(
                "SELECT id_seleccion, nombre FROM seleccion ORDER BY nombre").getResultList()).stream()
                .map(r -> new Item(asLong(r[0]), asStr(r[1]))).toList();

        List<Item> estadios = ((List<Object[]>) em.createNativeQuery(
                "SELECT id_estadio, nombre FROM estadio ORDER BY nombre").getResultList()).stream()
                .map(r -> new Item(asLong(r[0]), asStr(r[1]))).toList();

        return new Catalogos(paises, selecciones, estadios);
    }

    /** Sectores de un estadio (para habilitar en un evento). */
    @SuppressWarnings("unchecked")
    public List<Item> sectoresDeEstadio(Long idEstadio) {
        return ((List<Object[]>) em.createNativeQuery("""
                SELECT id_sector, nombre_sector FROM sector
                 WHERE id_estadio = :id ORDER BY nombre_sector
                """).setParameter("id", idEstadio).getResultList()).stream()
                .map(r -> new Item(asLong(r[0]), asStr(r[1]))).toList();
    }

    /** Genera un token QR nuevo para una entrada del usuario (rota cada ~30s). */
    @Transactional
    public TokenResp generarToken(Long idEntrada, Long idUsuario) {
        StoredProcedureQuery sp = em.createStoredProcedureQuery("sp_generar_token");
        sp.registerStoredProcedureParameter("p_id_entrada", Long.class, ParameterMode.IN);
        sp.registerStoredProcedureParameter("p_id_usuario", Long.class, ParameterMode.IN);
        sp.registerStoredProcedureParameter("p_codigo", String.class, ParameterMode.OUT);
        sp.registerStoredProcedureParameter("p_expira", java.time.OffsetDateTime.class, ParameterMode.OUT);
        sp.setParameter("p_id_entrada", idEntrada);
        sp.setParameter("p_id_usuario", idUsuario);
        sp.execute();
        String codigo = (String) sp.getOutputParameterValue("p_codigo");
        Object expira = sp.getOutputParameterValue("p_expira");
        return new TokenResp(codigo, String.valueOf(expira));
    }
}
