package com.example.B2BProyect.repository.proyecciones;

import java.util.UUID;

public record EmpresaRecord(UUID id,
                            String nombre,
                            String nit,
                            String razonSocial
) {}