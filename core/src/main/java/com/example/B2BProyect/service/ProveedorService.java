package com.example.B2BProyect.service;

import com.example.B2BProyect.repository.ProveedorRepository;
import com.example.B2BProyect.repository.dto.request.ProveedorRequest;
import com.example.B2BProyect.repository.dto.response.ProveedorDTO;
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
    public void save(UUID empresaId, ProveedorRequest request) {
        Proveedor proveedor = new Proveedor();
        proveedor.setActivo(request.getActivo());
        empresaService.findById(empresaId).ifPresent(proveedor::setIdEmpresa);
        proveedorRepository.save(proveedor);
    }

    @Transactional(readOnly = true)
    public List<ProveedorDTO> findAll() {
        return proveedorRepository.findAll().stream().map(ProveedorDTO::new).toList();
    }

    @Transactional(readOnly = true)
    public Optional<Proveedor> findById(UUID id) {
        return proveedorRepository.findById(id);
    }

    @Transactional(readOnly = true)
    public Optional<ProveedorDTO> findByIdDTO(UUID id) {
        return proveedorRepository.findByIdDTO(id);
    }
}
