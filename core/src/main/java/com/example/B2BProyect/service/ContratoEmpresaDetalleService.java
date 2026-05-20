package com.example.B2BProyect.service;

import com.example.B2BProyect.repository.ContratoEmpresaDetalleRepository;
import com.example.B2BProyect.repository.entity.ContratoEmpresaDetalle;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@AllArgsConstructor
public class ContratoEmpresaDetalleService {
    private final ContratoEmpresaDetalleRepository contratoEmpresaDetalleRepository;

    @Transactional
    public void save(ContratoEmpresaDetalle contratoEmpresaDetalle) {
        contratoEmpresaDetalleRepository.save(contratoEmpresaDetalle);
    }

    @Transactional(readOnly = true)
    public List<ContratoEmpresaDetalle> findAll() {
        return contratoEmpresaDetalleRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Optional<ContratoEmpresaDetalle> findById(UUID id) {
        return contratoEmpresaDetalleRepository.findById(id);
    }
}
