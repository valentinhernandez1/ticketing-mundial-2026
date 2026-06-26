package uy.edu.ucu.ticketing.config;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

// reenvia las rutas del frontend a index.html para que React Router
// funcione al recargar la pagina o entrar directo a una url
@Controller
public class SpaController {

    @GetMapping({
        "/login", "/register", "/comprar", "/mis-entradas", "/mis-compras",
        "/transferencias", "/validador",
        "/admin/estadios", "/admin/eventos", "/admin/usuarios",
        "/admin/dispositivos", "/admin/asignaciones", "/admin/reportes"
    })
    public String spa() {
        return "forward:/index.html";
    }
}
