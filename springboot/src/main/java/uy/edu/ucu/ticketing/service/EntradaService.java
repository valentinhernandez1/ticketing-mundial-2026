package uy.edu.ucu.ticketing.service;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import uy.edu.ucu.ticketing.model.Entrada;
import uy.edu.ucu.ticketing.model.enums.EstadoEntrada;
import uy.edu.ucu.ticketing.model.enums.EstadoVenta;
import uy.edu.ucu.ticketing.repository.TokenRepository;

import java.util.List;
import java.util.Map;

@Service
public class EntradaService {

    private final TokenRepository tokenRepo;

    public EntradaService(TokenRepository tokenRepo) {
        this.tokenRepo = tokenRepo;
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> entradasDeUsuario(Long idUsuario) {
        return tokenRepo.entradasDeUsuario(idUsuario);
    }

    @Transactional(readOnly = true)
    public boolean perteneceAlUsuario(Long idEntrada, Long idUsuario) {
        return tokenRepo.findEntradaDeUsuario(idEntrada, idUsuario).isPresent();
    }

    @Transactional
    public Map<String, Object> generarToken(Long idEntrada, Long idUsuario) {
        Entrada entrada = tokenRepo.findEntradaDeUsuario(idEntrada, idUsuario)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN,
                        "Esta entrada no es tuya"));

        if (entrada.getEstado() == EstadoEntrada.CONSUMIDA)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La entrada ya fue consumida");

        if (entrada.getEstadoVenta() != EstadoVenta.PAGA)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Tenés que pagar la compra antes de usar el QR");

        return tokenRepo.generarToken(idEntrada);
    }
}
