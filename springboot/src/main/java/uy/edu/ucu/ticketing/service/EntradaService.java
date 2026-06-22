package uy.edu.ucu.ticketing.service;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
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

    @Transactional
    public Map<String, Object> generarToken(Long idEntrada, Long idUsuario) {
        Map<String, Object> entrada = tokenRepo.findEntradaDeUsuario(idEntrada, idUsuario)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN,
                        "Esta entrada no es tuya"));

        if ("CONSUMIDA".equals(entrada.get("estado")))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La entrada ya fue consumida");

        // la venta tiene que estar paga para poder usar el QR
        if (!"PAGA".equals(entrada.get("estadoVenta")))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Tenés que pagar la compra antes de usar el QR");

        return tokenRepo.generarToken(idEntrada);
    }
}
