package com.example.B2BProyect.service;

import com.example.B2BProyect.repository.AlmacenRepository;
import com.example.B2BProyect.repository.entity.Almacen;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@AllArgsConstructor
public class AlmacenService {
    private final AlmacenRepository almacenRepository;

    @Transactional
    public void save(Almacen almacen) {
        almacenRepository.save(almacen);
    }

    @Transactional(readOnly = true)
    public List<Almacen> findAll() {
        return almacenRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Optional<Almacen> findById(UUID id) {
        return almacenRepository.findById(id);
    }
}
