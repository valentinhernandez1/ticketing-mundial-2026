package uy.edu.ucu.ticketing.service;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import uy.edu.ucu.ticketing.dto.CompraRequest;
import uy.edu.ucu.ticketing.repository.CompraRepository;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class CompraService {

    private final CompraRepository compraRepo;

    public CompraService(CompraRepository compraRepo) {
        this.compraRepo = compraRepo;
    }

    @Transactional
    public Long registrarCompra(Long idUsuario, CompraRequest req) {
        List<Long> items = req.eventoSectores();

        if (items == null || items.isEmpty())
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tenés que elegir al menos una entrada");

        if (items.size() > 5)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No podés comprar más de 5 entradas por transacción");

        // traigo la comisión vigente
        Map<String, Object> comisionRow = compraRepo.comisionVigente()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                        "No hay una comisión configurada para hoy"));

        Long idComision = ((Number) comisionRow.get("id_comision")).longValue();
        BigDecimal porcentaje = (BigDecimal) comisionRow.get("porcentaje");

        // verifico disponibilidad sector por sector y calculo el subtotal
        BigDecimal subtotal = BigDecimal.ZERO;
        List<Map<String, Object>> sectores = new ArrayList<>();

        for (Long idEs : items) {
            Map<String, Object> es = compraRepo.findEventoSector(idEs)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                            "Sector " + idEs + " no existe"));

            long cupo = ((Number) es.get("cupo_habilitado")).longValue();
            long vendidas = ((Number) es.get("vendidas")).longValue();

            if (cupo - vendidas <= 0)
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                        "No quedan entradas disponibles en el sector " + idEs);

            subtotal = subtotal.add((BigDecimal) es.get("precio"));
            sectores.add(es);
        }

        // calculo la comisión y el total
        BigDecimal montoComision = subtotal
                .multiply(porcentaje)
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        BigDecimal total = subtotal.add(montoComision);

        // inserto la venta
        Long idVenta = compraRepo.insertarVenta(idUsuario, idComision, porcentaje, subtotal, montoComision, total);

        // inserto una entrada por cada sector pedido
        for (int i = 0; i < items.size(); i++) {
            BigDecimal precio = (BigDecimal) sectores.get(i).get("precio");
            compraRepo.insertarEntrada(idVenta, items.get(i), idUsuario, precio);
        }

        return idVenta;
    }

    @Transactional
    public void confirmar(Long idVenta, Long idUsuario) {
        Map<String, Object> venta = compraRepo.findVenta(idVenta)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Venta no encontrada"));

        Long duenio = ((Number) venta.get("id_usuario")).longValue();
        if (!duenio.equals(idUsuario))
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No podés confirmar una venta que no es tuya");

        if (!"PENDIENTE".equals(venta.get("estado")))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Solo se puede confirmar una venta PENDIENTE (estado actual: " + venta.get("estado") + ")");

        compraRepo.confirmarVenta(idVenta);
    }

    @Transactional
    public void pagar(Long idVenta, Long idUsuario) {
        Map<String, Object> venta = compraRepo.findVenta(idVenta)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Venta no encontrada"));

        Long duenio = ((Number) venta.get("id_usuario")).longValue();
        if (!duenio.equals(idUsuario))
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No podés pagar una venta que no es tuya");

        if (!"CONFIRMADA".equals(venta.get("estado")))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Solo se puede pagar una venta CONFIRMADA (estado actual: " + venta.get("estado") + ")");

        compraRepo.marcarPaga(idVenta);
    }

    public List<Map<String, Object>> comprasDeUsuario(Long idUsuario) {
        return compraRepo.comprasDeUsuario(idUsuario);
    }
}
