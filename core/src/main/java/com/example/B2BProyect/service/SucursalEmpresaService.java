package com.example.B2BProyect.service;

import com.example.B2BProyect.repository.SucursalEmpresaRepository;
import com.example.B2BProyect.repository.dto.request.SucursalEmpresaRequest;
import com.example.B2BProyect.repository.dto.response.SucursalEmpresaDTO;
import com.example.B2BProyect.repository.entity.SucursalEmpresa;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@AllArgsConstructor
public class SucursalEmpresaService {
    private final SucursalEmpresaRepository sucursalEmpresaRepository;
    private final EmpresaService empresaService;

    @Transactional
    public void save(SucursalEmpresaRequest request) {
        SucursalEmpresa sucursal = new SucursalEmpresa();
        sucursal.setNombre(request.getNombre());
        sucursal.setDireccion(request.getDireccion());
        sucursal.setCoordenadas(request.getCoordenadas());
        sucursal.setActivo(request.getActivo());
        if (request.getIdEmpresa() != null)
            empresaService.findById(request.getIdEmpresa()).ifPresent(sucursal::setIdEmpresa);
        sucursalEmpresaRepository.save(sucursal);
    }

    @Transactional(readOnly = true)
    public List<SucursalEmpresaDTO> findAll() {
        return sucursalEmpresaRepository.findAll().stream().map(SucursalEmpresaDTO::new).toList();
    }

    @Transactional(readOnly = true)
    public Optional<SucursalEmpresa> findById(UUID id) {
        return sucursalEmpresaRepository.findById(id);
    }

    @Transactional
    public Optional<SucursalEmpresaDTO> update(UUID id, SucursalEmpresaRequest dto) {
        return sucursalEmpresaRepository.findById(id).map(sucursal -> {
            if (dto.getNombre() != null)      sucursal.setNombre(dto.getNombre());
            if (dto.getDireccion() != null)   sucursal.setDireccion(dto.getDireccion());
            if (dto.getCoordenadas() != null) sucursal.setCoordenadas(dto.getCoordenadas());
            if (dto.getActivo() != null)      sucursal.setActivo(dto.getActivo());
            if (dto.getIdEmpresa() != null)
                empresaService.findById(dto.getIdEmpresa()).ifPresent(sucursal::setIdEmpresa);
            return new SucursalEmpresaDTO(sucursalEmpresaRepository.save(sucursal));
        });
    }

    @Transactional
    public boolean delete(UUID id) {
        if (!sucursalEmpresaRepository.existsById(id)) return false;
        sucursalEmpresaRepository.deleteById(id);
        return true;
    }
}
