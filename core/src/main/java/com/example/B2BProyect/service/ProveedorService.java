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

    @Transactional
    public Optional<ProveedorDTO> update(UUID id, ProveedorRequest dto) {
        return proveedorRepository.findById(id).map(proveedor -> {
            if (dto.getActivo() != null) proveedor.setActivo(dto.getActivo());
            return new ProveedorDTO(proveedorRepository.save(proveedor));
        });
    }

    @Transactional
    public boolean delete(UUID id) {
        if (!proveedorRepository.existsById(id)) return false;
        proveedorRepository.deleteById(id);
        return true;
    }
}
