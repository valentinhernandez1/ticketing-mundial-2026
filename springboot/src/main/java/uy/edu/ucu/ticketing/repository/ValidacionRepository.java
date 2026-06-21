package uy.edu.ucu.ticketing.repository;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@Repository
public class ValidacionRepository {

    private final JdbcTemplate jdbc;

    public ValidacionRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public Optional<Map<String, Object>> findDispositivo(Long idDispositivo) {
        List<Map<String, Object>> rows = jdbc.queryForList(
                "SELECT id_dispositivo, id_funcionario, estado::text AS estado FROM dispositivo WHERE id_dispositivo = ?",
                idDispositivo);
        return rows.isEmpty() ? Optional.empty() : Optional.of(rows.get(0));
    }

    // busco por el código QR (el string hex que muestra el QR)
    public Optional<Map<String, Object>> findTokenActivoPorCodigo(Long idEntrada, String codigoToken) {
        List<Map<String, Object>> rows = jdbc.queryForList("""
                SELECT id_token, id_entrada, codigo_token, activo, fecha_expiracion
                FROM token_qr
                WHERE id_entrada = ? AND codigo_token = ?
                  AND activo = TRUE AND fecha_expiracion > NOW()
                """, idEntrada, codigoToken);
        return rows.isEmpty() ? Optional.empty() : Optional.of(rows.get(0));
    }

    public Optional<Map<String, Object>> findEntrada(Long idEntrada) {
        List<Map<String, Object>> rows = jdbc.queryForList(
                "SELECT id_entrada, estado::text, id_evento_sector FROM entrada WHERE id_entrada = ?",
                idEntrada);
        return rows.isEmpty() ? Optional.empty() : Optional.of(rows.get(0));
    }

    public boolean funcionarioAsignadoAlSector(Long idFuncionario, Long idEvento, Long idSector) {
        Integer count = jdbc.queryForObject("""
                SELECT COUNT(*) FROM asignacion_funcionario_sector
                WHERE id_funcionario = ? AND id_evento = ? AND id_sector = ?
                """, Integer.class, idFuncionario, idEvento, idSector);
        return count != null && count > 0;
    }

    public void insertarValidacion(Long idEntrada, Long idToken, Long idFuncionario,
                                    Long idDispositivo, String codigoQr, String resultado) {
        jdbc.update("""
                INSERT INTO validacion (id_entrada, id_token, id_funcionario, id_dispositivo,
                                        codigo_qr_validado, resultado)
                VALUES (?, ?, ?, ?, ?, ?::dom_resultado_val)
                """, idEntrada, idToken, idFuncionario, idDispositivo, codigoQr, resultado);
    }

    // marco consumida e invalido los tokens activos
    public void consumirEntrada(Long idEntrada) {
        jdbc.update("UPDATE entrada SET estado = 'CONSUMIDA' WHERE id_entrada = ?", idEntrada);
        jdbc.update("UPDATE token_qr SET activo = FALSE WHERE id_entrada = ? AND activo = TRUE", idEntrada);
    }

    public Optional<Map<String, Object>> findEventoSectorDeEntrada(Long idEventoSector) {
        List<Map<String, Object>> rows = jdbc.queryForList(
                "SELECT id_evento, id_sector FROM evento_sector WHERE id_evento_sector = ?",
                idEventoSector);
        return rows.isEmpty() ? Optional.empty() : Optional.of(rows.get(0));
    }
}
