package com.example.B2BProyect.service;

import com.example.B2BProyect.repository.ReglasComisionRepository;
import com.example.B2BProyect.repository.entity.ReglasComision;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@AllArgsConstructor
public class ReglasComisionService {
    private final ReglasComisionRepository reglasComisionRepository;

    @Transactional
    public void save(ReglasComision reglasComision) {
        reglasComisionRepository.save(reglasComision);
    }

    @Transactional(readOnly = true)
    public List<ReglasComision> findAll() {
        return reglasComisionRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Optional<ReglasComision> findById(UUID id) {
        return reglasComisionRepository.findById(id);
    }
}
