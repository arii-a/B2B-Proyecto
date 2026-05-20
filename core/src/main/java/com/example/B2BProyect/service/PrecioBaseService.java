package com.example.B2BProyect.service;

import com.example.B2BProyect.repository.PrecioBaseRepository;
import com.example.B2BProyect.repository.entity.PrecioBase;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@AllArgsConstructor
public class PrecioBaseService {
    private final PrecioBaseRepository precioBaseRepository;

    @Transactional
    public void save(PrecioBase precioBase) {
        precioBaseRepository.save(precioBase);
    }

    @Transactional(readOnly = true)
    public List<PrecioBase> findAll() {
        return precioBaseRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Optional<PrecioBase> findById(UUID id) {
        return precioBaseRepository.findById(id);
    }
}
