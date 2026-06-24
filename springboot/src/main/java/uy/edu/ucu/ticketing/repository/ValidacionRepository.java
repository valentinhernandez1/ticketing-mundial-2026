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

    public Optional<Map<String, Object>> findTokenActivoPorCodigo(Long idEntrada, String codigoToken) {
        List<Map<String, Object>> rows = jdbc.queryForList("""
                SELECT id_token FROM token_qr
                WHERE id_entrada = ? AND codigo_token = ?
                  AND activo = TRUE AND fecha_expiracion > NOW()
                """, idEntrada, codigoToken);
        return rows.isEmpty() ? Optional.empty() : Optional.of(rows.get(0));
    }

    public String validar(Long idEntrada, Long idToken, Long idFuncionario, Long idDispositivo) {
        return jdbc.queryForObject(
                "SELECT fn_validar_acceso_wrapper(?, ?, ?, ?)",
                String.class, idEntrada, idToken, idFuncionario, idDispositivo);
    }
}
