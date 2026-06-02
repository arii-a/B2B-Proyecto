package com.example.B2BProyect.service;

import com.example.B2BProyect.repository.CargoEmpresaRepository;
import com.example.B2BProyect.repository.dto.request.CargoEmpresaRequest;
import com.example.B2BProyect.repository.dto.response.CargoEmpresaDTO;
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
    public void save(CargoEmpresaRequest request) {
        CargoEmpresa cargoEmpresa = new CargoEmpresa();
        cargoEmpresa.setNombre(request.getNombre());
        cargoEmpresaRepository.save(cargoEmpresa);
    }

    @Transactional(readOnly = true)
    public List<CargoEmpresaDTO> findAll() {
        return cargoEmpresaRepository.findAll().stream().map(CargoEmpresaDTO::new).toList();
    }

    @Transactional(readOnly = true)
    public Optional<CargoEmpresa> findById(UUID id) {
        return cargoEmpresaRepository.findById(id);
    }

    @Transactional
    public Optional<CargoEmpresaDTO> update(UUID id, CargoEmpresaRequest dto) {
        return cargoEmpresaRepository.findById(id).map(cargo -> {
            if (dto.getNombre() != null) cargo.setNombre(dto.getNombre());
            return new CargoEmpresaDTO(cargoEmpresaRepository.save(cargo));
        });
    }

    @Transactional
    public boolean delete(UUID id) {
        if (!cargoEmpresaRepository.existsById(id)) return false;
        cargoEmpresaRepository.deleteById(id);
        return true;
    }
}
