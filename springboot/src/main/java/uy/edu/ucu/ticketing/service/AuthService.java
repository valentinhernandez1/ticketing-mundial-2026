package uy.edu.ucu.ticketing.service;

import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import uy.edu.ucu.ticketing.dto.AuthDtos.*;
import uy.edu.ucu.ticketing.repository.DireccionRepository;
import uy.edu.ucu.ticketing.repository.DocumentoRepository;
import uy.edu.ucu.ticketing.repository.TelefonoRepository;
import uy.edu.ucu.ticketing.repository.UsuarioGeneralRepository;
import uy.edu.ucu.ticketing.repository.UsuarioRepository;
import uy.edu.ucu.ticketing.security.JwtService;

import java.util.Map;

@Service
public class AuthService {

    private final DireccionRepository direcRepo;
    private final UsuarioRepository usuarioRepo;
    private final DocumentoRepository documentoRepo;
    private final UsuarioGeneralRepository usuarioGeneralRepo;
    private final TelefonoRepository telefonoRepo;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwt;

    public AuthService(DireccionRepository direcRepo, UsuarioRepository usuarioRepo,
                       DocumentoRepository documentoRepo, UsuarioGeneralRepository usuarioGeneralRepo,
                       TelefonoRepository telefonoRepo, PasswordEncoder passwordEncoder, JwtService jwt) {
        this.direcRepo = direcRepo;
        this.usuarioRepo = usuarioRepo;
        this.documentoRepo = documentoRepo;
        this.usuarioGeneralRepo = usuarioGeneralRepo;
        this.telefonoRepo = telefonoRepo;
        this.passwordEncoder = passwordEncoder;
        this.jwt = jwt;
    }

    @Transactional
    public AuthResponse register(RegisterRequest req) {
        String hash = passwordEncoder.encode(req.password());

        // orden importa por FK: direccion → usuario → documento → usuario_general
        Long idDir = direcRepo.insertar(req.dirIdPais(), req.localidad(), req.calle(), req.numero(), req.codigoPostal());
        Long id = usuarioRepo.insertar(req.email(), hash, req.nombre(), req.apellido(), idDir);
        documentoRepo.insertar(id, req.docIdPais(), req.tipoDocumento(), req.docNumero());
        usuarioGeneralRepo.insertar(id);

        if (req.telefonos() != null) {
            for (var tel : req.telefonos()) {
                String tipo = (tel.tipo() == null || tel.tipo().isBlank()) ? "MOVIL" : tel.tipo();
                telefonoRepo.insertar(id, tel.numero(), tipo);
            }
        }

        String token = jwt.generar(req.email(), "USUARIO_GENERAL", id);
        return new AuthResponse(token, "USUARIO_GENERAL", id);
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest req) {
        Map<String, Object> user = usuarioRepo.findByEmailConHash(req.email())
                .orElseThrow(() -> new BadCredentialsException("Credenciales invalidas"));

        if (!passwordEncoder.matches(req.password(), (String) user.get("password_hash")))
            throw new BadCredentialsException("Credenciales invalidas");

        Long idUsuario = ((Number) user.get("id_usuario")).longValue();
        String rol = usuarioRepo.getRol(idUsuario);
        String token = jwt.generar((String) user.get("email"), rol, idUsuario);
        return new AuthResponse(token, rol, idUsuario);
    }
}
