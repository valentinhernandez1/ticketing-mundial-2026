package uy.edu.ucu.ticketing.controller;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import uy.edu.ucu.ticketing.domain.Entrada;
import uy.edu.ucu.ticketing.domain.Transferencia;
import uy.edu.ucu.ticketing.domain.enums.EstadoEntrada;
import uy.edu.ucu.ticketing.repository.EntradaRepository;
import uy.edu.ucu.ticketing.repository.TransferenciaRepository;
import uy.edu.ucu.ticketing.repository.VentaRepository;
import java.util.List;

@RestController
@RequestMapping("/api/usuarios/{id}")
@PreAuthorize("hasRole('USUARIO_GENERAL')")
public class EntradaController {

    private final EntradaRepository entradas;
    private final TransferenciaRepository transferencias;
    private final VentaRepository ventas;

    public EntradaController(EntradaRepository entradas, TransferenciaRepository transferencias,
                             VentaRepository ventas) {
        this.entradas = entradas;
        this.transferencias = transferencias;
        this.ventas = ventas;
    }

    /** Un usuario solo puede consultar sus propios datos (no los de otro id). */
    private void verificarPropietario(Long id, Long uid) {
        if (!id.equals(uid)) {
            throw new AccessDeniedException("No puede consultar datos de otro usuario");
        }
    }

    /** Compras (ventas) ingresadas por el usuario. */
    @GetMapping("/compras")
    public List<Object[]> misCompras(@PathVariable Long id, @AuthenticationPrincipal Long uid) {
        verificarPropietario(id, uid);
        return ventas.comprasUsuario(id);
    }

    /** Entradas que el usuario tiene asignadas actualmente. */
    @GetMapping("/entradas")
    public List<Entrada> misEntradas(@PathVariable Long id, @AuthenticationPrincipal Long uid) {
        verificarPropietario(id, uid);
        return entradas.entradasActuales(id,
                List.of(EstadoEntrada.EMITIDA, EstadoEntrada.TRANSFERIDA));
    }

    /** Transferencias realizadas/recibidas por el usuario. */
    @GetMapping("/transferencias")
    public List<Transferencia> misTransferencias(@PathVariable Long id, @AuthenticationPrincipal Long uid) {
        verificarPropietario(id, uid);
        return transferencias.porUsuario(id);
    }
}
