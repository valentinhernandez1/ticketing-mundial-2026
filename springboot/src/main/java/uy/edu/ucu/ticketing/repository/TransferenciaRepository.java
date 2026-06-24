package uy.edu.ucu.ticketing.repository;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;
import uy.edu.ucu.ticketing.model.Transferencia;
import uy.edu.ucu.ticketing.model.enums.EstadoTransferencia;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@Repository
public class TransferenciaRepository {

    private final JdbcTemplate jdbc;

    public TransferenciaRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public Optional<Transferencia> findById(Long idTransferencia) {
        List<Transferencia> rows = jdbc.query("""
                SELECT id_transferencia, id_entrada, id_usuario_origen,
                       id_usuario_destino, estado::text AS estado
                FROM transferencia WHERE id_transferencia = ?
                """,
                (rs, i) -> {
                    Transferencia t = new Transferencia();
                    t.setId(rs.getLong("id_transferencia"));
                    t.setIdEntrada(rs.getLong("id_entrada"));
                    t.setIdUsuarioOrigen(rs.getLong("id_usuario_origen"));
                    t.setIdUsuarioDestino(rs.getLong("id_usuario_destino"));
                    t.setEstado(EstadoTransferencia.valueOf(rs.getString("estado")));
                    return t;
                }, idTransferencia);
        return rows.isEmpty() ? Optional.empty() : Optional.of(rows.get(0));
    }

    public void marcarRechazada(Long idTransferencia, Long idEntrada) {
        jdbc.update("UPDATE transferencia SET estado = 'RECHAZADA' WHERE id_transferencia = ?", idTransferencia);
        // Solo restaura a EMITIDA si la entrada sigue en TRANSFERIDA (guarda contra race condition)
        jdbc.update("UPDATE entrada SET estado = 'EMITIDA' WHERE id_entrada = ? AND estado = 'TRANSFERIDA'", idEntrada);
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
