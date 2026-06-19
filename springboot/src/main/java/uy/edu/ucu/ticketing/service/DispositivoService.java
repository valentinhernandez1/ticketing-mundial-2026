package uy.edu.ucu.ticketing.service;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import uy.edu.ucu.ticketing.repository.DispositivoRepository;
import java.util.List;
import java.util.Map;

@Service
public class DispositivoService {

    private final DispositivoRepository dispositivoRepo;

    public DispositivoService(DispositivoRepository dispositivoRepo) {
        this.dispositivoRepo = dispositivoRepo;
    }

    public List<Map<String, Object>> listar() {
        return dispositivoRepo.findAll();
    }

    public Long registrar(String identificadorFisico, Long idFuncionario) {
        if (!dispositivoRepo.existeFuncionario(idFuncionario))
            throw new ResponseStatusException(HttpStatus.NOT_FOUND,
                    "El funcionario " + idFuncionario + " no existe");

        return dispositivoRepo.insertar(identificadorFisico, idFuncionario);
    }

    public void desactivar(Long idDispositivo) {
        dispositivoRepo.findById(idDispositivo)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Dispositivo no encontrado"));
        dispositivoRepo.desactivar(idDispositivo);
    }
}
