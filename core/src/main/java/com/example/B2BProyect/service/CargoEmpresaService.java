package com.example.B2BProyect.service;

import com.example.B2BProyect.repository.CargoEmpresaRepository;
import com.example.B2BProyect.repository.entity.CargoEmpresa;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@AllArgsConstructor
public class CargoEmpresaService {
    private final CargoEmpresaRepository cargoEmpresaRepository;

    @Transactional
    public void save(CargoEmpresa cargoEmpresa) {
        cargoEmpresaRepository.save(cargoEmpresa);
    }

    @Transactional(readOnly = true)
    public List<CargoEmpresa> findAll() {
        return cargoEmpresaRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Optional<CargoEmpresa> findById(UUID id) {
        return cargoEmpresaRepository.findById(id);
    }
}
