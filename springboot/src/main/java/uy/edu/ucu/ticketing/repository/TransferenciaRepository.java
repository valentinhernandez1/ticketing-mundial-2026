package uy.edu.ucu.ticketing.repository;

import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@Repository
public class TransferenciaRepository {

    private final JdbcTemplate jdbc;

    public TransferenciaRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public Optional<Map<String, Object>> findEntrada(Long idEntrada) {
        List<Map<String, Object>> rows = jdbc.queryForList("""
                SELECT id_entrada, id_usuario_actual, estado::text, cantidad_transferencias
                FROM entrada WHERE id_entrada = ?
                """, idEntrada);
        return rows.isEmpty() ? Optional.empty() : Optional.of(rows.get(0));
    }

    // no puede haber dos transferencias pendientes para la misma entrada
    public boolean tienePendiente(Long idEntrada) {
        Integer count = jdbc.queryForObject(
                "SELECT COUNT(*) FROM transferencia WHERE id_entrada = ? AND estado = 'PENDIENTE'",
                Integer.class, idEntrada);
        return count != null && count > 0;
    }

    // bloqueo la entrada y creo la transferencia pendiente
    public Long iniciarTransferencia(Long idEntrada, Long idOrigen, Long idDestino) {
        jdbc.update("UPDATE entrada SET estado = 'TRANSFERIDA' WHERE id_entrada = ?", idEntrada);
        return jdbc.queryForObject("""
                INSERT INTO transferencia (id_entrada, id_usuario_origen, id_usuario_destino, estado)
                VALUES (?, ?, ?, 'PENDIENTE')
                RETURNING id_transferencia
                """, Long.class, idEntrada, idOrigen, idDestino);
    }

    // acepto: cambio el titular de la entrada y sumo 1 al contador
    public void aceptarTransferencia(Long idTransferencia, Long idDestino) {
        Map<String, Object> t = jdbc.queryForMap(
                "SELECT id_entrada, id_usuario_destino, estado::text FROM transferencia WHERE id_transferencia = ?",
                idTransferencia);

        if (!idDestino.equals(((Number) t.get("id_usuario_destino")).longValue()))
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN, "Solo el destinatario puede aceptar");

        if (!"PENDIENTE".equals(t.get("estado")))
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "La transferencia ya fue " + t.get("estado"));

        Long idEntrada = ((Number) t.get("id_entrada")).longValue();

        jdbc.update("""
                UPDATE transferencia
                SET estado = 'ACEPTADA', fecha_aceptacion = NOW()
                WHERE id_transferencia = ?
                """, idTransferencia);

        // el trigger fn_transferencia_aceptar ya incrementa cantidad_transferencias
        // nosotros solo cambiamos el titular y el estado
        jdbc.update("""
                UPDATE entrada
                SET id_usuario_actual = ?, estado = 'EMITIDA'
                WHERE id_entrada = ?
                """, idDestino, idEntrada);
    }

    public void rechazarTransferencia(Long idTransferencia, Long idSolicitante) {
        Map<String, Object> t = jdbc.queryForMap(
                "SELECT id_entrada, id_usuario_destino, estado::text FROM transferencia WHERE id_transferencia = ?",
                idTransferencia);

        if (!idSolicitante.equals(((Number) t.get("id_usuario_destino")).longValue()))
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Solo el destinatario puede rechazar");

        if (!"PENDIENTE".equals(t.get("estado")))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "La transferencia ya fue " + t.get("estado"));

        Long idEntrada = ((Number) t.get("id_entrada")).longValue();

        jdbc.update("""
                UPDATE transferencia SET estado = 'RECHAZADA', fecha_aceptacion = NOW()
                WHERE id_transferencia = ?
                """, idTransferencia);

        // devuelvo la entrada al estado EMITIDA para que el dueño original pueda usarla
        jdbc.update("UPDATE entrada SET estado = 'EMITIDA' WHERE id_entrada = ?", idEntrada);
    }

    // las que inició y las que recibió
    public List<Map<String, Object>> transferenciasDeUsuario(Long idUsuario) {
        return jdbc.queryForList("""
                SELECT t.id_transferencia    AS "idTransferencia",
                       t.id_entrada          AS "idEntrada",
                       t.id_usuario_origen   AS "idOrigen",
                       t.id_usuario_destino  AS "idDestino",
                       t.fecha_transferencia AS "fecha",
                       t.fecha_aceptacion    AS "fechaAceptacion",
                       t.estado::text        AS "estado"
                FROM transferencia t
                WHERE t.id_usuario_origen = ? OR t.id_usuario_destino = ?
                ORDER BY t.fecha_transferencia DESC
                """, idUsuario, idUsuario);
    }
}
