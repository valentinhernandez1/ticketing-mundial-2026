package uy.edu.ucu.ticketing.service;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import uy.edu.ucu.ticketing.dto.TransferenciaRequest;
import uy.edu.ucu.ticketing.repository.TransferenciaRepository;
import uy.edu.ucu.ticketing.repository.UsuarioRepository;

import java.util.List;
import java.util.Map;

@Service
public class TransferenciaService {

    private final TransferenciaRepository transferenciaRepo;
    private final UsuarioRepository usuarioRepo;

    public TransferenciaService(TransferenciaRepository transferenciaRepo, UsuarioRepository usuarioRepo) {
        this.transferenciaRepo = transferenciaRepo;
        this.usuarioRepo = usuarioRepo;
    }

    @Transactional
    public Long iniciar(Long idSolicitante, TransferenciaRequest req) {
        Map<String, Object> entrada = transferenciaRepo.findEntrada(req.idEntrada())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Entrada no encontrada"));

        Long titular = ((Number) entrada.get("id_usuario_actual")).longValue();
        if (!titular.equals(idSolicitante))
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Solo el titular puede transferir la entrada");

        String estado = (String) entrada.get("estado");
        if ("CONSUMIDA".equals(estado))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No se puede transferir una entrada ya consumida");

        int transferencias = ((Number) entrada.get("cantidad_transferencias")).intValue();
        if (transferencias >= 3)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Esta entrada ya alcanzó el máximo de 3 transferencias");

        if (transferenciaRepo.tienePendiente(req.idEntrada()))
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Ya hay una transferencia pendiente para esta entrada");

        // busco al destinatario por email
        Map<String, Object> destino = usuarioRepo.findByEmail(req.emailDestino())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "No existe un usuario con el email: " + req.emailDestino()));
        Long idDestino = ((Number) destino.get("id_usuario")).longValue();

        if (idDestino.equals(idSolicitante))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No podés transferirte la entrada a vos mismo");

        return transferenciaRepo.iniciarTransferencia(req.idEntrada(), idSolicitante, idDestino);
    }

    @Transactional
    public void aceptar(Long idTransferencia, Long idSolicitante) {
        transferenciaRepo.aceptarTransferencia(idTransferencia, idSolicitante);
    }

    @Transactional
    public void rechazar(Long idTransferencia, Long idSolicitante) {
        transferenciaRepo.rechazarTransferencia(idTransferencia, idSolicitante);
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> transferenciasUsuario(Long idUsuario) {
        return transferenciaRepo.transferenciasDeUsuario(idUsuario);
    }
}
