package uy.edu.ucu.ticketing.controller;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import uy.edu.ucu.ticketing.service.AuditoriaTransferenciaService;
import uy.edu.ucu.ticketing.service.CompraService;
import uy.edu.ucu.ticketing.service.EntradaService;
import uy.edu.ucu.ticketing.service.TransferenciaService;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/usuarios/{id}")
@PreAuthorize("hasRole('USUARIO_GENERAL')")
public class EntradaController {

    private final EntradaService entradaService;
    private final TransferenciaService transferenciaService;
    private final CompraService compraService;
    private final AuditoriaTransferenciaService auditoriaService;

    public EntradaController(EntradaService entradaService,
                             TransferenciaService transferenciaService,
                             CompraService compraService,
                             AuditoriaTransferenciaService auditoriaService) {
        this.entradaService = entradaService;
        this.transferenciaService = transferenciaService;
        this.compraService = compraService;
        this.auditoriaService = auditoriaService;
    }

    private void verificarPropietario(Long id, Long uid) {
        if (!id.equals(uid))
            throw new AccessDeniedException("No puede consultar datos de otro usuario");
    }

    @GetMapping("/compras")
    public List<Map<String, Object>> misCompras(@PathVariable Long id, @AuthenticationPrincipal Long uid) {
        verificarPropietario(id, uid);
        return compraService.comprasDeUsuario(id);
    }

    @GetMapping("/entradas")
    public List<Map<String, Object>> misEntradas(@PathVariable Long id, @AuthenticationPrincipal Long uid) {
        verificarPropietario(id, uid);
        return entradaService.entradasDeUsuario(id);
    }

    @GetMapping("/transferencias")
    public List<Map<String, Object>> misTransferencias(@PathVariable Long id, @AuthenticationPrincipal Long uid) {
        verificarPropietario(id, uid);
        return transferenciaService.transferenciasUsuario(id);
    }

    // historial de auditoría de una entrada: emisión, transferencias y validación
    @GetMapping("/entradas/{idEntrada}/historial")
    public List<Map<String, Object>> historial(@PathVariable Long id,
                                               @PathVariable Long idEntrada,
                                               @AuthenticationPrincipal Long uid) {
        verificarPropietario(id, uid);
        return auditoriaService.historialEntrada(idEntrada);
    }
}
