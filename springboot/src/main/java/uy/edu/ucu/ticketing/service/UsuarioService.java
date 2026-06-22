package uy.edu.ucu.ticketing.service;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import uy.edu.ucu.ticketing.dto.CrearStaffRequest;
import uy.edu.ucu.ticketing.repository.AdministradorPaisRepository;
import uy.edu.ucu.ticketing.repository.DireccionRepository;
import uy.edu.ucu.ticketing.repository.DocumentoRepository;
import uy.edu.ucu.ticketing.repository.FuncionarioValidacionRepository;
import uy.edu.ucu.ticketing.repository.UsuarioRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Service
public class UsuarioService {

    private final DireccionRepository direcRepo;
    private final UsuarioRepository usuarioRepo;
    private final DocumentoRepository documentoRepo;
    private final AdministradorPaisRepository adminRepo;
    private final FuncionarioValidacionRepository funcRepo;
    private final PasswordEncoder passwordEncoder;

    public UsuarioService(DireccionRepository direcRepo,
                          UsuarioRepository usuarioRepo,
                          DocumentoRepository documentoRepo,
                          AdministradorPaisRepository adminRepo,
                          FuncionarioValidacionRepository funcRepo,
                          PasswordEncoder passwordEncoder) {
        this.direcRepo = direcRepo;
        this.usuarioRepo = usuarioRepo;
        this.documentoRepo = documentoRepo;
        this.adminRepo = adminRepo;
        this.funcRepo = funcRepo;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public Long crearAdmin(CrearStaffRequest req) {
        String hash = passwordEncoder.encode(req.password());
        Long idDir = direcRepo.insertar(req.dirIdPais(), req.localidad(), req.calle(), req.numero(), req.codigoPostal());
        Long idUsuario = usuarioRepo.insertar(req.email(), hash, req.nombre(), req.apellido(), idDir);
        documentoRepo.insertar(idUsuario, req.docIdPais(), req.tipoDocumento(), req.docNumero());
        adminRepo.insertar(idUsuario, req.idPaisSede(), LocalDate.now());
        return idUsuario;
    }

    @Transactional
    public Long crearFuncionario(CrearStaffRequest req) {
        String hash = passwordEncoder.encode(req.password());
        Long idDir = direcRepo.insertar(req.dirIdPais(), req.localidad(), req.calle(), req.numero(), req.codigoPostal());
        Long idUsuario = usuarioRepo.insertar(req.email(), hash, req.nombre(), req.apellido(), idDir);
        documentoRepo.insertar(idUsuario, req.docIdPais(), req.tipoDocumento(), req.docNumero());
        funcRepo.insertar(idUsuario, req.numeroLegajo());
        return idUsuario;
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> listarAdmins() {
        return adminRepo.findAll();
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> listarFuncionarios() {
        return funcRepo.findAll();
    }
}
