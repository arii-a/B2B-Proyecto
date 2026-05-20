package com.example.B2BProyect.service;

import com.example.B2BProyect.repository.DetalleFacturaRepository;
import com.example.B2BProyect.repository.entity.DetalleFactura;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@AllArgsConstructor
public class DetalleFacturaService {
    private final DetalleFacturaRepository detalleFacturaRepository;

    @Transactional
    public void save(DetalleFactura detalleFactura) {
        detalleFacturaRepository.save(detalleFactura);
    }

    @Transactional(readOnly = true)
    public List<DetalleFactura> findAll() {
        return detalleFacturaRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Optional<DetalleFactura> findById(UUID id) {
        return detalleFacturaRepository.findById(id);
    }
}
