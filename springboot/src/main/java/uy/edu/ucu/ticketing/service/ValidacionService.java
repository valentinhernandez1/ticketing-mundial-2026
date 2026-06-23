package uy.edu.ucu.ticketing.service;

import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import uy.edu.ucu.ticketing.dto.ValidacionRequest;
import uy.edu.ucu.ticketing.repository.ValidacionRepository;

import java.sql.CallableStatement;
import java.sql.Types;
import java.util.Map;
import java.util.Optional;

@Service
public class ValidacionService {

    private final ValidacionRepository validacionRepo;
    private final JdbcTemplate jdbc;

    public ValidacionService(ValidacionRepository validacionRepo, JdbcTemplate jdbc) {
        this.validacionRepo = validacionRepo;
        this.jdbc = jdbc;
    }

    @Transactional
    public String validar(Long idFuncionario, ValidacionRequest req) {
        // El QR codifica "{idEntrada}:{codigoToken}"
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

        // Verificación previa del dispositivo para dar mensajes de error claros al cliente
        var disp = validacionRepo.findDispositivo(req.idDispositivo())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Dispositivo no registrado"));

        if (!"ACTIVO".equals(disp.get("estado")))
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "El dispositivo está inactivo");

        Long idFuncDisp = ((Number) disp.get("id_funcionario")).longValue();
        if (!idFuncDisp.equals(idFuncionario))
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Este dispositivo no es tuyo");

        // Buscar el token activo por código (puede ser null si el token venció o es inválido)
        Optional<Map<String, Object>> tokenOpt = validacionRepo.findTokenActivoPorCodigo(idEntrada, codigoToken);
        Long idToken = tokenOpt.map(t -> ((Number) t.get("id_token")).longValue()).orElse(null);

        // sp_validar_acceso maneja ACEPTADO y RECHAZADO con su handler de excepción:
        // - Si es ACEPTADO: el trigger fn_validacion_before valida todo; fn_validacion_after consume la entrada
        // - Si falla: el handler inserta un registro RECHAZADO para auditoría y retorna 'RECHAZADO: motivo'
        String resultado = jdbc.execute((java.sql.Connection conn) -> {
            try (CallableStatement cs = conn.prepareCall("{ CALL sp_validar_acceso(?, ?, ?, ?, ?) }")) {
                cs.setLong(1, idEntrada);
                if (idToken != null) cs.setLong(2, idToken); else cs.setNull(2, Types.BIGINT);
                cs.setLong(3, idFuncionario);
                cs.setLong(4, req.idDispositivo());
                cs.registerOutParameter(5, Types.VARCHAR);
                cs.execute();
                return cs.getString(5);
            }
        });

        // El SP retorna 'ACEPTADO' o 'RECHAZADO: motivo...' — normalizamos a solo la palabra clave
        return resultado != null && resultado.startsWith("ACEPTADO") ? "ACEPTADO" : "RECHAZADO";
    }
}
