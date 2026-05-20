package com.example.B2BProyect.service;

import com.example.B2BProyect.repository.ContratoEmpresaTarifaRepository;
import com.example.B2BProyect.repository.entity.ContratoEmpresaTarifa;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@AllArgsConstructor
public class ContratoEmpresaTarifaService {
    private final ContratoEmpresaTarifaRepository contratoEmpresaTarifaRepository;

    @Transactional
    public void save(ContratoEmpresaTarifa contratoEmpresaTarifa) {
        contratoEmpresaTarifaRepository.save(contratoEmpresaTarifa);
    }

    @Transactional(readOnly = true)
    public List<ContratoEmpresaTarifa> findAll() {
        return contratoEmpresaTarifaRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Optional<ContratoEmpresaTarifa> findById(UUID id) {
        return contratoEmpresaTarifaRepository.findById(id);
    }
}
