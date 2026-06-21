package uy.edu.ucu.ticketing.service;

import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import uy.edu.ucu.ticketing.dto.TelefonoRequest;
import uy.edu.ucu.ticketing.repository.TelefonoRepository;

import java.util.List;
import java.util.Map;

@Service
public class TelefonoService {

    private final TelefonoRepository telefonoRepo;

    public TelefonoService(TelefonoRepository telefonoRepo) {
        this.telefonoRepo = telefonoRepo;
    }

    private void verificarPropietario(Long id, Long uid) {
        if (!id.equals(uid)) {
            throw new AccessDeniedException("No puede gestionar telefonos de otro usuario");
        }
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> listar(Long id, Long uid) {
        verificarPropietario(id, uid);
        return telefonoRepo.findByUsuario(id);
    }

    @Transactional
    public Map<String, Object> agregar(Long id, Long uid, TelefonoRequest req) {
        verificarPropietario(id, uid);
        String tipo = req.tipoEfectivo();
        Long idTelefono = telefonoRepo.insertar(id, req.numero(), tipo);
        return Map.of("idTelefono", idTelefono, "numero", req.numero(), "tipo", tipo);
    }

    @Transactional
    public void eliminar(Long id, Long uid, Long idTelefono) {
        verificarPropietario(id, uid);
        int borrados = telefonoRepo.eliminar(idTelefono, id);
        if (borrados == 0) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND,
                    "Telefono no encontrado o no pertenece al usuario");
        }
    }
}
