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
        tokenRepo.findEntradaDeUsuario(idEntrada, idUsuario)
                .filter(e -> !"CONSUMIDA".equals(e.get("estado")))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN,
                        "Esta entrada no es tuya o ya fue consumida"));
        return tokenRepo.generarToken(idEntrada);
    }
}
