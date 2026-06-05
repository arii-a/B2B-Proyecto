package com.example.B2BProyect.repository.dto.response;

import com.example.B2BProyect.repository.entity.CargoEmpresa;
import com.example.B2BProyect.repository.entity.ContactosEmpresa;
import com.example.B2BProyect.repository.entity.Empresa;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
public class ContactosEmpresaDTO {
    private UUID id;
    private String nombres;
    private String apellidos;
    private String nombreCargoEmpresa;
    private String nombreEmpresa;
    private EmpresaDTO idEmpresa;

    public ContactosEmpresaDTO(ContactosEmpresa contacto) {
        this.id = contacto.getId();
        this.nombres = contacto.getNombres();
        this.apellidos = contacto.getApellidos();
        this.nombreCargoEmpresa = contacto.getIdCargoEmpresa().getNombre();
        this.idEmpresa = new EmpresaDTO(contacto.getIdEmpresa());
    }

    public ContactosEmpresaDTO(UUID id, String nombres, String apellidos,
                                String nombreCargoEmpresa, String nombreEmpresa) {
        this.id = id;
        this.nombres = nombres;
        this.apellidos = apellidos;
        this.nombreCargoEmpresa = nombreCargoEmpresa;
        this.nombreEmpresa = nombreEmpresa;
    }

    public ContactosEmpresaDTO(UUID id, String nombres, String apellidos,
                                CargoEmpresa idCargoEmpresa, Empresa idEmpresa) {
        this.id = id;
        this.nombres = nombres;
        this.apellidos = apellidos;
        this.nombreCargoEmpresa = idCargoEmpresa.getNombre();
        this.idEmpresa = new EmpresaDTO(idEmpresa);
    }
}
