package com.example.B2BProyect.service;

import com.example.B2BProyect.repository.FacturaRepository;
import com.example.B2BProyect.repository.entity.Factura;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@AllArgsConstructor
public class FacturaService {
    private final FacturaRepository facturaRepository;

    @Transactional
    public void save(Factura factura) {
        facturaRepository.save(factura);
    }

    @Transactional(readOnly = true)
    public List<Factura> findAll() {
        return facturaRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Optional<Factura> findById(UUID id) {
        return facturaRepository.findById(id);
    }
}
