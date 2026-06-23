package uy.edu.ucu.ticketing.service;

import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import uy.edu.ucu.ticketing.dto.CompraRequest;
import uy.edu.ucu.ticketing.repository.VentaRepository;

import java.sql.CallableStatement;
import java.sql.Types;
import java.util.List;
import java.util.Map;

@Service
public class CompraService {

    private final VentaRepository ventaRepo;
    private final JdbcTemplate jdbc;

    public CompraService(VentaRepository ventaRepo, JdbcTemplate jdbc) {
        this.ventaRepo = ventaRepo;
        this.jdbc = jdbc;
    }

    @Transactional
    public Long registrarCompra(Long idUsuario, CompraRequest req) {
        List<Long> items = req.eventoSectores();

        if (items == null || items.isEmpty())
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tenés que elegir al menos una entrada");

        if (items.size() > 5)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No podés comprar más de 5 entradas por transacción");

        // Delegamos toda la lógica al stored procedure sp_registrar_compra:
        // - valida que el usuario sea USUARIO_GENERAL
        // - crea la venta (trigger aplica la comisión vigente)
        // - crea N entradas (trigger valida aforo y aplica precio por sector)
        return jdbc.execute((java.sql.Connection conn) -> {
            try (CallableStatement cs = conn.prepareCall("{ CALL sp_registrar_compra(?, ?, ?) }")) {
                cs.setLong(1, idUsuario);
                cs.setArray(2, conn.createArrayOf("bigint", items.toArray(new Long[0])));
                cs.registerOutParameter(3, Types.BIGINT);
                cs.execute();
                return cs.getLong(3);
            }
        });
    }

    @Transactional
    public void confirmar(Long idVenta, Long idUsuario) {
        Map<String, Object> venta = ventaRepo.findById(idVenta)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Venta no encontrada"));

        Long duenio = ((Number) venta.get("id_usuario")).longValue();
        if (!duenio.equals(idUsuario))
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No podés confirmar una venta que no es tuya");

        if (!"PENDIENTE".equals(venta.get("estado")))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Solo se puede confirmar una venta PENDIENTE (estado actual: " + venta.get("estado") + ")");

        ventaRepo.confirmar(idVenta);
    }

    @Transactional
    public void pagar(Long idVenta, Long idUsuario) {
        Map<String, Object> venta = ventaRepo.findById(idVenta)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Venta no encontrada"));

        Long duenio = ((Number) venta.get("id_usuario")).longValue();
        if (!duenio.equals(idUsuario))
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No podés pagar una venta que no es tuya");

        if (!"CONFIRMADA".equals(venta.get("estado")))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Solo se puede pagar una venta CONFIRMADA (estado actual: " + venta.get("estado") + ")");

        ventaRepo.marcarPaga(idVenta);
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> comprasDeUsuario(Long idUsuario) {
        return ventaRepo.porUsuario(idUsuario);
    }
}
