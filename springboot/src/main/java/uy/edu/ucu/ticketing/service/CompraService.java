package uy.edu.ucu.ticketing.service;

import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import uy.edu.ucu.ticketing.dto.CompraRequest;
import uy.edu.ucu.ticketing.model.Venta;
import uy.edu.ucu.ticketing.model.enums.EstadoVenta;
import uy.edu.ucu.ticketing.repository.VentaRepository;

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

        // fn_registrar_compra_wrapper hace todo: valida el rol, crea la venta y las entradas.
        // uso una funcion wrapper porque el driver JDBC no banca CALL con parametros OUT
        Long[] sectores = items.toArray(new Long[0]);
        return jdbc.execute((java.sql.Connection conn) -> {
            try (var ps = conn.prepareStatement("SELECT fn_registrar_compra_wrapper(?, ?)")) {
                ps.setLong(1, idUsuario);
                ps.setArray(2, conn.createArrayOf("bigint", sectores));
                try (var rs = ps.executeQuery()) {
                    rs.next();
                    return rs.getLong(1);
                }
            }
        });
    }

    @Transactional
    public void confirmar(Long idVenta, Long idUsuario) {
        Venta venta = ventaRepo.findById(idVenta)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Venta no encontrada"));

        if (!venta.getIdUsuario().equals(idUsuario))
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No podés confirmar una venta que no es tuya");

        if (venta.getEstado() != EstadoVenta.PENDIENTE)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Solo se puede confirmar una venta PENDIENTE (estado actual: " + venta.getEstado() + ")");

        ventaRepo.confirmar(idVenta);
    }

    @Transactional
    public void pagar(Long idVenta, Long idUsuario) {
        Venta venta = ventaRepo.findById(idVenta)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Venta no encontrada"));

        if (!venta.getIdUsuario().equals(idUsuario))
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No podés pagar una venta que no es tuya");

        if (venta.getEstado() != EstadoVenta.CONFIRMADA)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Solo se puede pagar una venta CONFIRMADA (estado actual: " + venta.getEstado() + ")");

        ventaRepo.marcarPaga(idVenta);
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> comprasDeUsuario(Long idUsuario) {
        return ventaRepo.porUsuario(idUsuario);
    }
}
