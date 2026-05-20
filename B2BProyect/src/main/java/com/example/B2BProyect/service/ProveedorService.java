package com.example.B2BProyect.service;

import com.example.B2BProyect.repository.EmpresaRepository;
import com.example.B2BProyect.repository.ProveedorRepository;
import com.example.B2BProyect.repository.entity.Empresa;
import com.example.B2BProyect.repository.entity.Proveedor;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@AllArgsConstructor
public class ProveedorService {
    private final ProveedorRepository proveedorRepository;
    private final EmpresaService empresaService;

    @Transactional
    public void save(UUID empresaId, Proveedor proveedor) {
        Optional<Empresa> optionalEmpresa = this.empresaService.findById(empresaId);
        Empresa empresa = null;
        if(optionalEmpresa.isPresent()) {
            empresa = optionalEmpresa.get();
        }
        proveedor.setId_empresa(empresa);
        proveedorRepository.save(proveedor);
    }

    @Transactional(readOnly = true)
    public List<Proveedor> findAll() {
        return proveedorRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Optional<Proveedor> findById(UUID id) {
        return proveedorRepository.findById(id);
    }
}
