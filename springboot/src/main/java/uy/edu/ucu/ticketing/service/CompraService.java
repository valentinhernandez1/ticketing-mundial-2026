package uy.edu.ucu.ticketing.service;

import jakarta.persistence.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import uy.edu.ucu.ticketing.dto.CompraRequest;

@Service
public class CompraService {

    @PersistenceContext
    private EntityManager em;

    /**
     * Registra la compra invocando el procedimiento sp_registrar_compra.
     * La logica de negocio (max 5, aforo, comision) reside en la BD,
     * garantizando consistencia aun ante accesos concurrentes.
     */
    @Transactional
    public Long registrarCompra(Long idUsuario, CompraRequest req) {
        Long[] arr = req.eventoSectores().toArray(new Long[0]);

        StoredProcedureQuery sp = em.createStoredProcedureQuery("sp_registrar_compra");
        sp.registerStoredProcedureParameter("p_id_usuario", Long.class, ParameterMode.IN);
        sp.registerStoredProcedureParameter("p_evento_sectores", Long[].class, ParameterMode.IN);
        sp.registerStoredProcedureParameter("p_id_venta", Long.class, ParameterMode.OUT);

        sp.setParameter("p_id_usuario", idUsuario);
        sp.setParameter("p_evento_sectores", arr);
        sp.execute();

        return (Long) sp.getOutputParameterValue("p_id_venta");
    }

    /** Marca una venta CONFIRMADA como PAGA (solo el dueno de la venta). */
    @Transactional
    public void pagar(Long idVenta, Long idUsuario) {
        StoredProcedureQuery sp = em.createStoredProcedureQuery("sp_marcar_venta_paga");
        sp.registerStoredProcedureParameter("p_id_venta", Long.class, ParameterMode.IN);
        sp.registerStoredProcedureParameter("p_id_usuario", Long.class, ParameterMode.IN);
        sp.setParameter("p_id_venta", idVenta);
        sp.setParameter("p_id_usuario", idUsuario);
        sp.execute();
    }
}
