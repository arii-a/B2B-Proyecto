package com.example.B2BProyect.service;

import com.example.B2BProyect.repository.TarifaReglaRepository;
import com.example.B2BProyect.repository.entity.TarifaRegla;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@AllArgsConstructor
public class TarifaReglaService {
    private final TarifaReglaRepository tarifaReglaRepository;

    @Transactional
    public void save(TarifaRegla tarifaRegla) {
        tarifaReglaRepository.save(tarifaRegla);
    }

    @Transactional(readOnly = true)
    public List<TarifaRegla> findAll() {
        return tarifaReglaRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Optional<TarifaRegla> findById(UUID id) {
        return tarifaReglaRepository.findById(id);
    }
}
