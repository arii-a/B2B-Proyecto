package com.example.B2BProyect.service;

import com.example.B2BProyect.repository.DetalleOrdenRepository;
import com.example.B2BProyect.repository.entity.DetalleOrden;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@AllArgsConstructor
public class DetalleOrdenService {
    private final DetalleOrdenRepository detalleOrdenRepository;

    @Transactional
    public void save(DetalleOrden detalleOrden) {
        detalleOrdenRepository.save(detalleOrden);
    }

    @Transactional(readOnly = true)
    public List<DetalleOrden> findAll() {
        return detalleOrdenRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Optional<DetalleOrden> findById(UUID id) {
        return detalleOrdenRepository.findById(id);
    }
}
