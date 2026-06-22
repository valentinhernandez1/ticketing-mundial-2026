package uy.edu.ucu.ticketing.service;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import uy.edu.ucu.ticketing.dto.CompraRequest;
import uy.edu.ucu.ticketing.repository.ComisionRepository;
import uy.edu.ucu.ticketing.repository.EntradaRepository;
import uy.edu.ucu.ticketing.repository.EventoSectorRepository;
import uy.edu.ucu.ticketing.repository.VentaRepository;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class CompraService {

    private final VentaRepository ventaRepo;
    private final EntradaRepository entradaRepo;
    private final EventoSectorRepository eventoSectorRepo;
    private final ComisionRepository comisionRepo;

    public CompraService(VentaRepository ventaRepo, EntradaRepository entradaRepo,
                         EventoSectorRepository eventoSectorRepo, ComisionRepository comisionRepo) {
        this.ventaRepo = ventaRepo;
        this.entradaRepo = entradaRepo;
        this.eventoSectorRepo = eventoSectorRepo;
        this.comisionRepo = comisionRepo;
    }

    @Transactional
    public Long registrarCompra(Long idUsuario, CompraRequest req) {
        List<Long> items = req.eventoSectores();

        if (items == null || items.isEmpty())
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tenés que elegir al menos una entrada");

        if (items.size() > 5)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No podés comprar más de 5 entradas por transacción");

        // el trigger detecta duplicados pero el error sería feo; lo atajo acá con mensaje claro
        if (items.stream().distinct().count() != items.size())
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "No podés comprar dos veces la misma ubicación en una transacción");

        // necesito la comision de hoy para calcular el total
        Map<String, Object> comisionRow = comisionRepo.vigente()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                        "No hay una comisión configurada para hoy"));

        Long idComision = ((Number) comisionRow.get("id_comision")).longValue();
        BigDecimal porcentaje = (BigDecimal) comisionRow.get("porcentaje");

        // reviso cupo y precio sector a sector
        BigDecimal subtotal = BigDecimal.ZERO;
        List<Map<String, Object>> sectores = new ArrayList<>();

        for (Long idEs : items) {
            Map<String, Object> es = eventoSectorRepo.findById(idEs)
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

        BigDecimal montoComision = subtotal
                .multiply(porcentaje)
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        BigDecimal total = subtotal.add(montoComision);

        Long idVenta = ventaRepo.insertar(idUsuario, idComision, porcentaje, subtotal, montoComision, total);

        // una entrada por cada sector
        for (int i = 0; i < items.size(); i++) {
            BigDecimal precio = (BigDecimal) sectores.get(i).get("precio");
            entradaRepo.insertar(idVenta, items.get(i), idUsuario, precio);
        }

        return idVenta;
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
