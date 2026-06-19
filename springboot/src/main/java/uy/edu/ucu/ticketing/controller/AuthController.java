package uy.edu.ucu.ticketing.controller;

import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;
import uy.edu.ucu.ticketing.dto.AuthDtos.*;
import uy.edu.ucu.ticketing.service.AuthService;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService service;
    public AuthController(AuthService service) { this.service = service; }

    @PostMapping("/register")
    public AuthResponse register(@Valid @RequestBody RegisterRequest req) {
        return service.register(req);
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest req) {
        return service.login(req);
    }
}
