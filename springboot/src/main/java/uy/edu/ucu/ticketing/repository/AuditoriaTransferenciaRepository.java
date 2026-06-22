package uy.edu.ucu.ticketing.repository;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Map;

@Repository
public class AuditoriaTransferenciaRepository {

    private final JdbcTemplate jdbc;

    public AuditoriaTransferenciaRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    // historial completo de una entrada: emisión, transferencias y validación
    public List<Map<String, Object>> findByEntrada(Long idEntrada) {
        return jdbc.queryForList("""
                SELECT at.id_auditoria   AS "idAuditoria",
                       at.accion         AS "accion",
                       at.estado_anterior AS "estadoAnterior",
                       at.estado_nuevo    AS "estadoNuevo",
                       at.fecha_evento    AS "fecha",
                       uo.nombre          AS "nombreOrigen",
                       ud.nombre          AS "nombreDestino"
                FROM auditoria_transferencia at
                LEFT JOIN usuario uo ON uo.id_usuario = at.id_usuario_origen
                LEFT JOIN usuario ud ON ud.id_usuario = at.id_usuario_destino
                WHERE at.id_entrada = ?
                ORDER BY at.fecha_evento ASC
                """, idEntrada);
    }
}
