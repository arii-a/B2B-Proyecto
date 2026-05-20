package com.example.B2BProyect.service;

import com.example.B2BProyect.repository.SucursalEmpresaRepository;
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

    @Transactional
    public void save(SucursalEmpresa sucursalEmpresa) {
        sucursalEmpresaRepository.save(sucursalEmpresa);
    }

    @Transactional(readOnly = true)
    public List<SucursalEmpresa> findAll() {
        return sucursalEmpresaRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Optional<SucursalEmpresa> findById(UUID id) {
        return sucursalEmpresaRepository.findById(id);
    }
}
