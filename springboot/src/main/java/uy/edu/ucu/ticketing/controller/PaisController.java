package uy.edu.ucu.ticketing.controller;

import org.springframework.web.bind.annotation.*;
import uy.edu.ucu.ticketing.service.PaisService;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/paises")
public class PaisController {

    private final PaisService paisService;

    public PaisController(PaisService paisService) {
        this.paisService = paisService;
    }

    @GetMapping
    public List<Map<String, Object>> listar() {
        return paisService.listar();
    }
}
