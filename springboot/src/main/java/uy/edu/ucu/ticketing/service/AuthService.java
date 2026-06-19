package uy.edu.ucu.ticketing.service;

import jakarta.persistence.EntityManager;
import jakarta.persistence.ParameterMode;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.StoredProcedureQuery;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import uy.edu.ucu.ticketing.domain.Usuario;
import uy.edu.ucu.ticketing.dto.AuthDtos.*;
import uy.edu.ucu.ticketing.repository.UsuarioRepository;
import uy.edu.ucu.ticketing.security.JwtService;

@Service
public class AuthService {

    @PersistenceContext private EntityManager em;
    private final UsuarioRepository usuarios;
    private final JwtService jwt;
    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    public AuthService(UsuarioRepository usuarios, JwtService jwt) {
        this.usuarios = usuarios;
        this.jwt = jwt;
    }

    /**
     * Registra un usuario general. El hash bcrypt se calcula en la app y la
     * BD hace el alta atomica (direccion + usuario + documento + subtipo) via
     * sp_registrar_usuario_general. Devuelve un token para auto-login.
     */
    @Transactional
    public AuthResponse register(RegisterRequest req) {
        String hash = encoder.encode(req.password());

        StoredProcedureQuery sp = em.createStoredProcedureQuery("sp_registrar_usuario_general");
        sp.registerStoredProcedureParameter("p_email",          String.class,  ParameterMode.IN);
        sp.registerStoredProcedureParameter("p_password_hash",  String.class,  ParameterMode.IN);
        sp.registerStoredProcedureParameter("p_nombre",         String.class,  ParameterMode.IN);
        sp.registerStoredProcedureParameter("p_apellido",       String.class,  ParameterMode.IN);
        sp.registerStoredProcedureParameter("p_dir_id_pais",    Integer.class, ParameterMode.IN);
        sp.registerStoredProcedureParameter("p_localidad",      String.class,  ParameterMode.IN);
        sp.registerStoredProcedureParameter("p_calle",          String.class,  ParameterMode.IN);
        sp.registerStoredProcedureParameter("p_numero",         String.class,  ParameterMode.IN);
        sp.registerStoredProcedureParameter("p_codigo_postal",  String.class,  ParameterMode.IN);
        sp.registerStoredProcedureParameter("p_doc_id_pais",    Integer.class, ParameterMode.IN);
        sp.registerStoredProcedureParameter("p_tipo_documento", String.class,  ParameterMode.IN);
        sp.registerStoredProcedureParameter("p_doc_numero",     String.class,  ParameterMode.IN);
        sp.registerStoredProcedureParameter("p_id_usuario",     Long.class,    ParameterMode.OUT);

        sp.setParameter("p_email",          req.email());
        sp.setParameter("p_password_hash",  hash);
        sp.setParameter("p_nombre",         req.nombre());
        sp.setParameter("p_apellido",       req.apellido());
        sp.setParameter("p_dir_id_pais",    req.dirIdPais());
        sp.setParameter("p_localidad",      req.localidad());
        sp.setParameter("p_calle",          req.calle());
        sp.setParameter("p_numero",         req.numero());
        sp.setParameter("p_codigo_postal",  req.codigoPostal());
        sp.setParameter("p_doc_id_pais",    req.docIdPais());
        sp.setParameter("p_tipo_documento", req.tipoDocumento());
        sp.setParameter("p_doc_numero",     req.docNumero());
        sp.execute();

        Long id = (Long) sp.getOutputParameterValue("p_id_usuario");

        // Insertar telefonos si se enviaron (multivaluado 1:N)
        if (req.telefonos() != null) {
            for (var tel : req.telefonos()) {
                String tipo = (tel.tipo() == null || tel.tipo().isBlank()) ? "MOVIL" : tel.tipo();
                em.createNativeQuery(
                        "INSERT INTO telefono(id_usuario, numero, tipo) VALUES (:uid, :numero, :tipo)")
                        .setParameter("uid", id)
                        .setParameter("numero", tel.numero())
                        .setParameter("tipo", tipo)
                        .executeUpdate();
            }
        }

        String token = jwt.generar(req.email(), "USUARIO_GENERAL", id);
        return new AuthResponse(token, "USUARIO_GENERAL", id);
    }

    public AuthResponse login(LoginRequest req) {
        Usuario u = usuarios.findByEmail(req.email())
                .orElseThrow(() -> new BadCredentialsException("Credenciales invalidas"));

        // Verificar la contrasena contra el hash bcrypt almacenado en la BD.
        // La BD usa crypt() de pgcrypto que es compatible con BCrypt.
        if (!encoder.matches(req.password(), u.getPasswordHash())) {
            throw new BadCredentialsException("Credenciales invalidas");
        }

        String rol = resolverRol(u.getId());
        String token = jwt.generar(u.getEmail(), rol, u.getId());
        return new AuthResponse(token, rol, u.getId());
    }

    /** Determina el rol segun el subtipo al que pertenece el usuario. */
    private String resolverRol(Long id) {
        if (existe("administrador_pais", id))      return "ADMINISTRADOR_PAIS";
        if (existe("funcionario_validacion", id))  return "FUNCIONARIO_VALIDACION";
        if (existe("usuario_general", id))         return "USUARIO_GENERAL";
        throw new BadCredentialsException("Usuario sin rol asignado");
    }

    private boolean existe(String tabla, Long id) {
        Object r = em.createNativeQuery(
                "SELECT 1 FROM " + tabla + " WHERE id_usuario = :id")
                .setParameter("id", id)
                .getResultList().stream().findFirst().orElse(null);
        return r != null;
    }
}
