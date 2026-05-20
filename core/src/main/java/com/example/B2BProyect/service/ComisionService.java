package com.example.B2BProyect.service;

import com.example.B2BProyect.repository.ComisionRepository;
import com.example.B2BProyect.repository.entity.Comision;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@AllArgsConstructor
public class ComisionService {
    private final ComisionRepository comisionRepository;

    @Transactional
    public void save(Comision comision) {
        comisionRepository.save(comision);
    }

    @Transactional(readOnly = true)
    public List<Comision> findAll() {
        return comisionRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Optional<Comision> findById(UUID id) {
        return comisionRepository.findById(id);
    }
}
