package com.example.B2BProyect.service;

import com.example.B2BProyect.repository.OrdenCompraRepository;
import com.example.B2BProyect.repository.entity.OrdenCompra;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@AllArgsConstructor
public class OrdenCompraService {
    private final OrdenCompraRepository ordenCompraRepository;

    @Transactional
    public void save(OrdenCompra ordenCompra) {
        ordenCompraRepository.save(ordenCompra);
    }

    @Transactional(readOnly = true)
    public List<OrdenCompra> findAll() {
        return ordenCompraRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Optional<OrdenCompra> findById(UUID id) {
        return ordenCompraRepository.findById(id);
    }
}
