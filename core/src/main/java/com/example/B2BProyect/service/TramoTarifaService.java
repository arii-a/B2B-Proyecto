package com.example.B2BProyect.service;

import com.example.B2BProyect.repository.TramoTarifaRepository;
import com.example.B2BProyect.repository.entity.TramoTarifa;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@AllArgsConstructor
public class TramoTarifaService {
    private final TramoTarifaRepository tramoTarifaRepository;

    @Transactional
    public void save(TramoTarifa tramoTarifa) {
        tramoTarifaRepository.save(tramoTarifa);
    }

    @Transactional(readOnly = true)
    public List<TramoTarifa> findAll() {
        return tramoTarifaRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Optional<TramoTarifa> findById(UUID id) {
        return tramoTarifaRepository.findById(id);
    }
}
