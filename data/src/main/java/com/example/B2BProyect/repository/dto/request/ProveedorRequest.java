package com.example.B2BProyect.repository.dto.request;

import lombok.Getter;
import lombok.Setter;
import org.antlr.v4.runtime.misc.NotNull;

@Getter
@Setter
public class ProveedorRequest {

    @NotNull
    private Boolean activo;
}
