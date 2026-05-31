package com.example.B2BProyect.repository.dto.response;

import com.example.B2BProyect.repository.entity.CargoEmpresa;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
public class CargoEmpresaDTO {
    private UUID id;
    private String nombre;

    public CargoEmpresaDTO(CargoEmpresa cargoEmpresa) {
        this.id = cargoEmpresa.getId();
        this.nombre = cargoEmpresa.getNombre();
    }
}
