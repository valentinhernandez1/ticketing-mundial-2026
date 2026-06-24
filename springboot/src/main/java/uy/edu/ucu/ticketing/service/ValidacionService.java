package uy.edu.ucu.ticketing.service;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import uy.edu.ucu.ticketing.dto.ValidacionRequest;
import uy.edu.ucu.ticketing.repository.ValidacionRepository;

@Service
public class ValidacionService {

    private final ValidacionRepository validacionRepo;

    public ValidacionService(ValidacionRepository validacionRepo) {
        this.validacionRepo = validacionRepo;
    }

    @Transactional
    public String validar(Long idFuncionario, ValidacionRequest req) {
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

        var disp = validacionRepo.findDispositivo(req.idDispositivo())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Dispositivo no registrado"));

        if (!"ACTIVO".equals(disp.get("estado")))
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "El dispositivo está inactivo");

        Long idFuncDisp = ((Number) disp.get("id_funcionario")).longValue();
        if (!idFuncDisp.equals(idFuncionario))
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Este dispositivo no es tuyo");

        Long idToken = validacionRepo.findTokenActivoPorCodigo(idEntrada, codigoToken)
                .map(t -> ((Number) t.get("id_token")).longValue())
                .orElse(null);

        // fn_validar_acceso_wrapper llama a sp_validar_acceso internamente.
        // idToken puede ser NULL si el token no existe o venció → el SP registra RECHAZADO.
        String resultado = validacionRepo.validar(idEntrada, idToken, idFuncionario, req.idDispositivo());

        return resultado != null && resultado.startsWith("ACEPTADO") ? "ACEPTADO" : "RECHAZADO";
    }
}
