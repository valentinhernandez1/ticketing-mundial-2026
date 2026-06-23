package uy.edu.ucu.ticketing.service;

import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import uy.edu.ucu.ticketing.dto.TransferenciaRequest;
import uy.edu.ucu.ticketing.repository.TransferenciaRepository;
import uy.edu.ucu.ticketing.repository.UsuarioRepository;

import java.sql.CallableStatement;
import java.sql.Types;
import java.util.List;
import java.util.Map;

@Service
public class TransferenciaService {

    private final TransferenciaRepository transferenciaRepo;
    private final UsuarioRepository usuarioRepo;
    private final JdbcTemplate jdbc;

    public TransferenciaService(TransferenciaRepository transferenciaRepo,
                                 UsuarioRepository usuarioRepo,
                                 JdbcTemplate jdbc) {
        this.transferenciaRepo = transferenciaRepo;
        this.usuarioRepo = usuarioRepo;
        this.jdbc = jdbc;
    }

    @Transactional
    public Long iniciar(Long idSolicitante, TransferenciaRequest req) {
        Map<String, Object> destino = usuarioRepo.findByEmail(req.emailDestino())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "No existe un usuario con el email: " + req.emailDestino()));
        Long idDestino = ((Number) destino.get("id_usuario")).longValue();

        if (idDestino.equals(idSolicitante))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No podés transferirte la entrada a vos mismo");

        // sp_transferir_entrada valida titularidad, límite de 3, pendientes duplicados,
        // que el destino sea USUARIO_GENERAL, y bloquea la entrada en TRANSFERIDA
        return jdbc.execute((java.sql.Connection conn) -> {
            try (CallableStatement cs = conn.prepareCall("{ CALL sp_transferir_entrada(?, ?, ?, ?) }")) {
                cs.setLong(1, req.idEntrada());
                cs.setLong(2, idDestino);
                cs.setLong(3, idSolicitante);
                cs.registerOutParameter(4, Types.BIGINT);
                cs.execute();
                return cs.getLong(4);
            }
        });
    }

    @Transactional
    public void aceptar(Long idTransferencia, Long idSolicitante) {
        // Validación previa para dar mensaje descriptivo al cliente
        Map<String, Object> t = transferenciaRepo.findById(idTransferencia)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Transferencia no encontrada"));

        Long destino = ((Number) t.get("id_usuario_destino")).longValue();
        if (!destino.equals(idSolicitante))
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Solo el destinatario puede aceptar la transferencia");

        if (!"PENDIENTE".equals(t.get("estado")))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La transferencia ya fue " + t.get("estado"));

        // sp_aceptar_transferencia actualiza el estado; el trigger fn_transferencia_aceptar
        // cambia el titular y restaura la entrada a EMITIDA
        jdbc.execute((java.sql.Connection conn) -> {
            try (CallableStatement cs = conn.prepareCall("{ CALL sp_aceptar_transferencia(?, ?) }")) {
                cs.setLong(1, idTransferencia);
                cs.setLong(2, idSolicitante);
                cs.execute();
                return null;
            }
        });
    }

    @Transactional
    public void rechazar(Long idTransferencia, Long idSolicitante) {
        Map<String, Object> t = transferenciaRepo.findById(idTransferencia)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Transferencia no encontrada"));

        Long destino = ((Number) t.get("id_usuario_destino")).longValue();
        if (!destino.equals(idSolicitante))
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Solo el destinatario puede rechazar la transferencia");

        if (!"PENDIENTE".equals(t.get("estado")))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La transferencia ya fue " + t.get("estado"));

        Long idEntrada = ((Number) t.get("id_entrada")).longValue();
        transferenciaRepo.marcarRechazada(idTransferencia, idEntrada);
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> transferenciasUsuario(Long idUsuario) {
        return transferenciaRepo.transferenciasDeUsuario(idUsuario);
    }
}
