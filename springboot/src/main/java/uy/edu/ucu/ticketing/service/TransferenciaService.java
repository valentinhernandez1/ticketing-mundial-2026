package uy.edu.ucu.ticketing.service;

import jakarta.persistence.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import uy.edu.ucu.ticketing.dto.TransferenciaRequest;

@Service
public class TransferenciaService {

    @PersistenceContext
    private EntityManager em;

    @Transactional
    public Long iniciar(Long idSolicitante, TransferenciaRequest req) {
        StoredProcedureQuery sp = em.createStoredProcedureQuery("sp_transferir_entrada");
        sp.registerStoredProcedureParameter("p_id_entrada", Long.class, ParameterMode.IN);
        sp.registerStoredProcedureParameter("p_id_destino", Long.class, ParameterMode.IN);
        sp.registerStoredProcedureParameter("p_id_solicitante", Long.class, ParameterMode.IN);
        sp.registerStoredProcedureParameter("p_id_transferencia", Long.class, ParameterMode.OUT);
        sp.setParameter("p_id_entrada", req.idEntrada());
        sp.setParameter("p_id_destino", req.idDestino());
        sp.setParameter("p_id_solicitante", idSolicitante);
        sp.execute();
        return (Long) sp.getOutputParameterValue("p_id_transferencia");
    }

    @Transactional
    public void aceptar(Long idTransferencia, Long idSolicitante) {
        StoredProcedureQuery sp = em.createStoredProcedureQuery("sp_aceptar_transferencia");
        sp.registerStoredProcedureParameter("p_id_transferencia", Long.class, ParameterMode.IN);
        sp.registerStoredProcedureParameter("p_id_solicitante", Long.class, ParameterMode.IN);
        sp.setParameter("p_id_transferencia", idTransferencia);
        sp.setParameter("p_id_solicitante", idSolicitante);
        sp.execute();
    }
}
