package uy.edu.ucu.ticketing.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.List;

public class AuthDtos {
    public record LoginRequest(@Email @NotBlank String email,
                               @NotBlank String password) {}
    public record AuthResponse(String token, String rol, Long idUsuario) {}

    // tipo es opcional, default MOVIL
    public record TelefonoInline(@NotBlank String numero, String tipo) {}

    public record RegisterRequest(
            @Email @NotBlank String email,
            @NotBlank String password,
            @NotBlank String nombre,
            @NotBlank String apellido,
            // dirección
            @NotNull Integer dirIdPais,
            @NotBlank String localidad,
            @NotBlank String calle,
            @NotBlank String numero,
            @NotBlank String codigoPostal,
            // documento
            @NotNull Integer docIdPais,
            @NotBlank String tipoDocumento,
            @NotBlank String docNumero,
            List<TelefonoInline> telefonos
    ) {}
}
