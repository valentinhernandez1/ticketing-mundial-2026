package uy.edu.ucu.ticketing.security;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import javax.crypto.SecretKey;
import java.util.Date;
import java.util.Map;

@Service
public class JwtService {

    private final SecretKey key;
    private final long expirationMs;

    public JwtService(@Value("${security.jwt.secret}") String secret,
                      @Value("${security.jwt.expiration-ms}") long expirationMs) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes());
        this.expirationMs = expirationMs;
    }

    public String generar(String email, String rol, Long idUsuario) {
        Date now = new Date();
        return Jwts.builder()
                .subject(email)
                .claim("rol", rol)
                .claim("uid", idUsuario)
                .issuedAt(now)
                .expiration(new Date(now.getTime() + expirationMs))
                .signWith(key)
                .compact();
    }

    public String getEmail(String token) {
        return parse(token).getSubject();
    }

    public String getRol(String token) {
        Object val = parse(token).get("rol");
        return val == null ? null : val.toString();
    }

    /** Id del usuario autenticado (claim "uid"). */
    public Long getUid(String token) {
        Object uid = parse(token).get("uid");
        return uid == null ? null : ((Number) uid).longValue();
    }

    private io.jsonwebtoken.Claims parse(String token) {
        return Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload();
    }
}
