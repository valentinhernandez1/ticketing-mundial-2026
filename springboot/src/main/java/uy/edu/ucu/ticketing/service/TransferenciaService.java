package uy.edu.ucu.ticketing.service;

import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import uy.edu.ucu.ticketing.dto.TransferenciaRequest;
import uy.edu.ucu.ticketing.model.Transferencia;
import uy.edu.ucu.ticketing.model.Usuario;
import uy.edu.ucu.ticketing.model.enums.EstadoTransferencia;
import uy.edu.ucu.ticketing.repository.TransferenciaRepository;
import uy.edu.ucu.ticketing.repository.UsuarioRepository;

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
        Usuario destino = usuarioRepo.findByEmail(req.emailDestino())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "No existe un usuario con el email: " + req.emailDestino()));

        if (destino.getId().equals(idSolicitante))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No podés transferirte la entrada a vos mismo");

        // fn_transferir_entrada_wrapper llama internamente a sp_transferir_entrada:
        // valida titularidad, límite de 3, pendientes duplicados, que el destino sea
        // USUARIO_GENERAL, y bloquea la entrada en TRANSFERIDA.
        // Usamos SELECT sobre función porque el driver JDBC no soporta CALL con OUT params.
        return jdbc.queryForObject(
                "SELECT fn_transferir_entrada_wrapper(?, ?, ?)",
                Long.class,
                req.idEntrada(), destino.getId(), idSolicitante
        );
    }

    @Transactional
    public void aceptar(Long idTransferencia, Long idSolicitante) {
        Transferencia t = transferenciaRepo.findById(idTransferencia)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Transferencia no encontrada"));

        if (!t.getIdUsuarioDestino().equals(idSolicitante))
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Solo el destinatario puede aceptar la transferencia");

        if (t.getEstado() != EstadoTransferencia.PENDIENTE)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La transferencia ya fue " + t.getEstado());

        // CALL sin escape JDBC: el driver no convierte a SELECT, PostgreSQL lo acepta directamente
        jdbc.update("CALL sp_aceptar_transferencia(?, ?)", idTransferencia, idSolicitante);
    }

    @Transactional
    public void rechazar(Long idTransferencia, Long idSolicitante) {
        Transferencia t = transferenciaRepo.findById(idTransferencia)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Transferencia no encontrada"));

        if (!t.getIdUsuarioDestino().equals(idSolicitante))
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Solo el destinatario puede rechazar la transferencia");

        if (t.getEstado() != EstadoTransferencia.PENDIENTE)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La transferencia ya fue " + t.getEstado());

        transferenciaRepo.marcarRechazada(idTransferencia, t.getIdEntrada());
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> transferenciasUsuario(Long idUsuario) {
        return transferenciaRepo.transferenciasDeUsuario(idUsuario);
    }
}
