package uy.edu.ucu.ticketing.controller;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import uy.edu.ucu.ticketing.service.ComisionService;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/comisiones")
public class ComisionController {

    private final ComisionService comisionService;

    public ComisionController(ComisionService comisionService) {
        this.comisionService = comisionService;
    }

    public record ComisionRequest(@NotNull @Positive BigDecimal porcentaje,
                                   @NotNull LocalDate fechaInicio) {}

    @GetMapping
    public List<Map<String, Object>> listar() {
        return comisionService.listar();
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMINISTRADOR_PAIS')")
    public Map<String, Object> crear(@RequestBody ComisionRequest req) {
        Long id = comisionService.crear(req.porcentaje(), req.fechaInicio());
        return Map.of("idComision", id);
    }
}
