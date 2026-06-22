package uy.edu.ucu.ticketing.repository;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.security.SecureRandom;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Repository
public class TokenRepository {

    private final JdbcTemplate jdbc;

    public TokenRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public List<Map<String, Object>> entradasDeUsuario(Long idUsuario) {
        return jdbc.queryForList("""
                SELECT e.id_entrada          AS "idEntrada",
                       e.codigo_unico        AS "codigoUnico",
                       e.estado::text        AS "estado",
                       e.precio              AS "precio",
                       e.cantidad_transferencias AS "cantidadTransferencias",
                       s.nombre_sector::text AS "nombreSector",
                       sl.nombre             AS "seleccionLocal",
                       sv.nombre             AS "seleccionVisitante",
                       est.nombre            AS "estadio",
                       est.ciudad            AS "ciudad",
                       ev.fecha_hora_inicio  AS "fechaHora",
                       v.estado::text        AS "estadoVenta"
                FROM entrada e
                JOIN venta         v   ON v.id_venta  = e.id_venta
                JOIN evento_sector es  ON es.id_evento_sector = e.id_evento_sector
                JOIN sector        s   ON s.id_sector  = es.id_sector
                JOIN evento        ev  ON ev.id_evento = es.id_evento
                JOIN seleccion     sl  ON sl.id_seleccion = ev.id_seleccion_local
                JOIN seleccion     sv  ON sv.id_seleccion = ev.id_seleccion_visitante
                JOIN estadio       est ON est.id_estadio  = ev.id_estadio
                WHERE e.id_usuario_actual = ?
                ORDER BY e.fecha_emision DESC
                """, idUsuario);
    }

    // invalido el anterior y creo uno nuevo, expira en 35s
    public Map<String, Object> generarToken(Long idEntrada) {
        jdbc.update("UPDATE token_qr SET activo = FALSE WHERE id_entrada = ? AND activo = TRUE", idEntrada);

        String codigo = generarCodigoAleatorio();
        Timestamp expira = Timestamp.from(Instant.now().plusSeconds(35));

        jdbc.update("""
                INSERT INTO token_qr (id_entrada, codigo_token, fecha_expiracion, activo)
                VALUES (?, ?, ?, TRUE)
                """, idEntrada, codigo, expira);

        // formato "idEntrada:codigo", el validador lo parsea despues
        String qrContent = idEntrada + ":" + codigo;
        return Map.of("codigo", qrContent, "expira", expira.toString());
    }

    // confirmo que la entrada sea del usuario antes de darle el QR
    // BUG FIX: debe retornar estadoVenta para validar que la compra esté PAGA
    public Optional<Map<String, Object>> findEntradaDeUsuario(Long idEntrada, Long idUsuario) {
        List<Map<String, Object>> rows = jdbc.queryForList("""
                SELECT e.id_entrada,
                       e.id_usuario_actual,
                       e.estado::text        AS estado,
                       v.estado::text        AS estadoVenta
                FROM entrada e
                JOIN venta v ON v.id_venta = e.id_venta
                WHERE e.id_entrada = ? AND e.id_usuario_actual = ?
                """, idEntrada, idUsuario);
        return rows.isEmpty() ? Optional.empty() : Optional.of(rows.get(0));
    }

    private String generarCodigoAleatorio() {
        byte[] bytes = new byte[16];
        new SecureRandom().nextBytes(bytes);
        StringBuilder sb = new StringBuilder();
        for (byte b : bytes) sb.append(String.format("%02x", b));
        return sb.toString();
    }
}
