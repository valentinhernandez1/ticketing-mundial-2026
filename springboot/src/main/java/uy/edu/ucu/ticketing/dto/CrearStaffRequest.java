package uy.edu.ucu.ticketing.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CrearStaffRequest(
        @NotBlank String nombre,
        @NotBlank String apellido,
        @NotBlank @Email String email,
        @NotBlank String password,
        // direccion
        @NotNull Integer dirIdPais,
        @NotBlank String localidad,
        @NotBlank String calle,
        @NotBlank String numero,
        String codigoPostal,
        // documento
        @NotNull Integer docIdPais,
        @NotBlank String tipoDocumento,
        @NotBlank String docNumero,
        // solo para admin: id del país sede
        Integer idPaisSede,
        // solo para funcionario: número de legajo
        String numeroLegajo
) {}
