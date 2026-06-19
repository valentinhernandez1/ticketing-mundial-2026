package uy.edu.ucu.ticketing.service;

import jakarta.persistence.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import uy.edu.ucu.ticketing.dto.ValidacionRequest;

@Service
public class ValidacionService {

    @PersistenceContext
    private EntityManager em;

    @Transactional
    public String validar(Long idFuncionario, ValidacionRequest req) {
        StoredProcedureQuery sp = em.createStoredProcedureQuery("sp_validar_acceso");
        sp.registerStoredProcedureParameter("p_id_entrada", Long.class, ParameterMode.IN);
        sp.registerStoredProcedureParameter("p_id_token", Long.class, ParameterMode.IN);
        sp.registerStoredProcedureParameter("p_id_funcionario", Long.class, ParameterMode.IN);
        sp.registerStoredProcedureParameter("p_id_dispositivo", Long.class, ParameterMode.IN);
        sp.registerStoredProcedureParameter("p_resultado", String.class, ParameterMode.OUT);
        sp.setParameter("p_id_entrada", req.idEntrada());
        sp.setParameter("p_id_token", req.idToken());
        sp.setParameter("p_id_funcionario", idFuncionario);
        sp.setParameter("p_id_dispositivo", req.idDispositivo());
        sp.execute();
        return (String) sp.getOutputParameterValue("p_resultado");
    }
}
