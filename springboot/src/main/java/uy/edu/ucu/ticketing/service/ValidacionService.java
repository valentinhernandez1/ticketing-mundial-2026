package uy.edu.ucu.ticketing.service;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import uy.edu.ucu.ticketing.dto.ValidacionRequest;
import uy.edu.ucu.ticketing.repository.ValidacionRepository;

import java.util.Map;
import java.util.Optional;

@Service
public class ValidacionService {

    private final ValidacionRepository validacionRepo;

    public ValidacionService(ValidacionRepository validacionRepo) {
        this.validacionRepo = validacionRepo;
    }

    @Transactional
    public String validar(Long idFuncionario, ValidacionRequest req) {
        // el QR codifica "{idEntrada}:{codigoToken}", lo parseo acá
        String[] partes = req.codigoQr().split(":", 2);
        if (partes.length != 2)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Formato de QR inválido. Se esperaba idEntrada:codigoToken");

        Long idEntrada;
        String codigoToken;
        try {
            idEntrada = Long.parseLong(partes[0]);
            codigoToken = partes[1];
        } catch (NumberFormatException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "ID de entrada inválido en el QR");
        }

        // verifico que el dispositivo exista y esté activo
        var disp = validacionRepo.findDispositivo(req.idDispositivo())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Dispositivo no registrado"));

        if (!"ACTIVO".equals(disp.get("estado")))
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "El dispositivo está inactivo");

        Long idFuncDisp = ((Number) disp.get("id_funcionario")).longValue();
        if (!idFuncDisp.equals(idFuncionario))
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Este dispositivo no es tuyo");

        // busco la entrada
        Map<String, Object> entrada = validacionRepo.findEntrada(idEntrada)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Entrada no encontrada"));

        if ("CONSUMIDA".equals(entrada.get("estado")))
            throw new ResponseStatusException(HttpStatus.CONFLICT, "La entrada ya fue consumida");

        // verifico que el funcionario esté asignado al sector
        Map<String, Object> es = validacionRepo.findEventoSectorDeEntrada(
                ((Number) entrada.get("id_evento_sector")).longValue())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Sector no encontrado"));

        Long idEvento = ((Number) es.get("id_evento")).longValue();
        Long idSector = ((Number) es.get("id_sector")).longValue();

        if (!validacionRepo.funcionarioAsignadoAlSector(idFuncionario, idEvento, idSector))
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "No estás asignado al sector de esta entrada");

        // busco el token activo y verifico que el código coincida
        Optional<Map<String, Object>> tokenOpt = validacionRepo.findTokenActivoPorCodigo(idEntrada, codigoToken);

        String resultado;
        Long idToken = null;

        if (tokenOpt.isEmpty()) {
            resultado = "RECHAZADO";
        } else {
            idToken = ((Number) tokenOpt.get().get("id_token")).longValue();
            resultado = "ACEPTADO";
        }

        // registro el intento para auditoría — si fue rechazado por token inválido no tengo id_token
        if (idToken != null) {
            validacionRepo.insertarValidacion(idEntrada, idToken,
                    idFuncionario, req.idDispositivo(), req.codigoQr(), resultado);
        }

        if ("ACEPTADO".equals(resultado)) {
            validacionRepo.consumirEntrada(idEntrada);
        }

        return resultado;
    }
}
