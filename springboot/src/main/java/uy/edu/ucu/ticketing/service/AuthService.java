package uy.edu.ucu.ticketing.service;

import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import uy.edu.ucu.ticketing.dto.AuthDtos.*;
import uy.edu.ucu.ticketing.repository.AuthRepository;
import uy.edu.ucu.ticketing.security.JwtService;

import java.util.Map;

@Service
public class AuthService {

    private final AuthRepository authRepo;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwt;

    public AuthService(AuthRepository authRepo, PasswordEncoder passwordEncoder, JwtService jwt) {
        this.authRepo = authRepo;
        this.passwordEncoder = passwordEncoder;
        this.jwt = jwt;
    }

    @Transactional
    public AuthResponse register(RegisterRequest req) {
        String hash = passwordEncoder.encode(req.password());

        Long id = authRepo.registrarUsuario(
                req.email(), hash, req.nombre(), req.apellido(),
                req.dirIdPais(), req.localidad(), req.calle(), req.numero(), req.codigoPostal(),
                req.docIdPais(), req.tipoDocumento(), req.docNumero());

        if (req.telefonos() != null) {
            for (var tel : req.telefonos()) {
                String tipo = (tel.tipo() == null || tel.tipo().isBlank()) ? "MOVIL" : tel.tipo();
                authRepo.insertarTelefono(id, tel.numero(), tipo);
            }
        }

        String token = jwt.generar(req.email(), "USUARIO_GENERAL", id);
        return new AuthResponse(token, "USUARIO_GENERAL", id);
    }

    public AuthResponse login(LoginRequest req) {
        Map<String, Object> user = authRepo.findByEmail(req.email())
                .orElseThrow(() -> new BadCredentialsException("Credenciales invalidas"));

        if (!passwordEncoder.matches(req.password(), (String) user.get("password_hash")))
            throw new BadCredentialsException("Credenciales invalidas");

        Long idUsuario = ((Number) user.get("id_usuario")).longValue();
        String rol = authRepo.getRol(idUsuario);
        String token = jwt.generar((String) user.get("email"), rol, idUsuario);
        return new AuthResponse(token, rol, idUsuario);
    }
}
