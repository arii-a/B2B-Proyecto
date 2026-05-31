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
        if (request.getIdEmpresa() != null) {
            empresaService.findById(request.getIdEmpresa()).ifPresent(sucursal::setIdEmpresa);
        }
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
}
