package uy.edu.ucu.ticketing.repository;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

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

    public Optional<Map<String, Object>> findById(Long idTransferencia) {
        List<Map<String, Object>> rows = jdbc.queryForList("""
                SELECT id_transferencia, id_entrada, id_usuario_origen,
                       id_usuario_destino, estado::text AS estado
                FROM transferencia WHERE id_transferencia = ?
                """, idTransferencia);
        return rows.isEmpty() ? Optional.empty() : Optional.of(rows.get(0));
    }

    public boolean tienePendiente(Long idEntrada) {
        Integer count = jdbc.queryForObject(
                "SELECT COUNT(*) FROM transferencia WHERE id_entrada = ? AND estado = 'PENDIENTE'",
                Integer.class, idEntrada);
        return count != null && count > 0;
    }

    public Long iniciarTransferencia(Long idEntrada, Long idOrigen, Long idDestino) {
        // Marcar TRANSFERIDA para bloquear el QR mientras la transferencia está pendiente
        jdbc.update("UPDATE entrada SET estado = 'TRANSFERIDA' WHERE id_entrada = ?", idEntrada);
        return jdbc.queryForObject("""
                INSERT INTO transferencia (id_entrada, id_usuario_origen, id_usuario_destino, estado)
                VALUES (?, ?, ?, 'PENDIENTE')
                RETURNING id_transferencia
                """, Long.class, idEntrada, idOrigen, idDestino);
    }

    // El trigger fn_transferencia_aceptar cambia el titular y restaura estado='EMITIDA'
    public void marcarAceptada(Long idTransferencia) {
        jdbc.update("""
                UPDATE transferencia
                SET estado = 'ACEPTADA', fecha_aceptacion = NOW()
                WHERE id_transferencia = ?
                """, idTransferencia);
    }

    public void marcarRechazada(Long idTransferencia, Long idEntrada) {
        jdbc.update("UPDATE transferencia SET estado = 'RECHAZADA' WHERE id_transferencia = ?", idTransferencia);
        // Devolver la entrada a EMITIDA para que el remitente vuelva a poder usarla
        jdbc.update("UPDATE entrada SET estado = 'EMITIDA' WHERE id_entrada = ?", idEntrada);
    }

    public List<Map<String, Object>> transferenciasDeUsuario(Long idUsuario) {
        return jdbc.queryForList("""
                SELECT t.id_transferencia    AS "idTransferencia",
                       t.id_entrada          AS "idEntrada",
                       t.id_usuario_origen   AS "idOrigen",
                       t.id_usuario_destino  AS "idDestino",
                       uo.email::text        AS "emailOrigen",
                       ud.email::text        AS "emailDestino",
                       t.fecha_transferencia AS "fecha",
                       t.fecha_aceptacion    AS "fechaAceptacion",
                       t.estado::text        AS "estado"
                FROM transferencia t
                LEFT JOIN usuario uo ON uo.id_usuario = t.id_usuario_origen
                LEFT JOIN usuario ud ON ud.id_usuario = t.id_usuario_destino
                WHERE t.id_usuario_origen = ? OR t.id_usuario_destino = ?
                ORDER BY t.fecha_transferencia DESC
                """, idUsuario, idUsuario);
    }
}
