package uy.edu.ucu.ticketing.controller;

import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import uy.edu.ucu.ticketing.dto.CrearStaffRequest;
import uy.edu.ucu.ticketing.service.UsuarioService;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/usuarios")
@PreAuthorize("hasRole('ADMINISTRADOR_PAIS')")
public class UsuarioController {

    private final UsuarioService usuarioService;

    public UsuarioController(UsuarioService usuarioService) {
        this.usuarioService = usuarioService;
    }

    @PostMapping("/admins")
    public Map<String, Object> crearAdmin(@Valid @RequestBody CrearStaffRequest req) {
        Long id = usuarioService.crearAdmin(req);
        return Map.of("idUsuario", id);
    }

    @PostMapping("/funcionarios")
    public Map<String, Object> crearFuncionario(@Valid @RequestBody CrearStaffRequest req) {
        Long id = usuarioService.crearFuncionario(req);
        return Map.of("idUsuario", id);
    }

    @GetMapping("/admins")
    public List<Map<String, Object>> admins() {
        return usuarioService.listarAdmins();
    }

    @GetMapping("/funcionarios")
    public List<Map<String, Object>> funcionarios() {
        return usuarioService.listarFuncionarios();
    }
}
