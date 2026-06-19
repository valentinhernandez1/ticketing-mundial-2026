package uy.edu.ucu.ticketing.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.List;

/** DTOs de autenticacion agrupados. */
public class AuthDtos {
    public record LoginRequest(@Email @NotBlank String email,
                               @NotBlank String password) {}
    public record AuthResponse(String token, String rol, Long idUsuario) {}

    /** Telefono inline en el registro (tipo es opcional; default MOVIL). */
    public record TelefonoInline(@NotBlank String numero, String tipo) {}

    /**
     * Alta de un usuario general (consumidor) con sus datos personales.
     * telefonos es opcional: puede omitirse o enviarse vacio.
     */
    public record RegisterRequest(
            @Email @NotBlank String email,
            @NotBlank String password,
            @NotBlank String nombre,
            @NotBlank String apellido,
            // Direccion
            @NotNull Integer dirIdPais,
            @NotBlank String localidad,
            @NotBlank String calle,
            @NotBlank String numero,
            @NotBlank String codigoPostal,
            // Documento (Pais + Tipo + Numero, unico)
            @NotNull Integer docIdPais,
            @NotBlank String tipoDocumento,
            @NotBlank String docNumero,
            // Telefonos (multivaluado; puede ser null o lista vacia)
            List<TelefonoInline> telefonos
    ) {}
}
