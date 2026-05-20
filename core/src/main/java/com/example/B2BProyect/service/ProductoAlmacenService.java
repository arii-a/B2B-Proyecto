package com.example.B2BProyect.service;

import com.example.B2BProyect.repository.ProductoAlmacenRepository;
import com.example.B2BProyect.repository.entity.ProductoAlmacen;
import com.example.B2BProyect.repository.entity.ProductoAlmacenId;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@AllArgsConstructor
public class ProductoAlmacenService {
    private final ProductoAlmacenRepository productoAlmacenRepository;

    @Transactional
    public void save(ProductoAlmacen productoAlmacen) {
        productoAlmacenRepository.save(productoAlmacen);
    }

    @Transactional(readOnly = true)
    public List<ProductoAlmacen> findAll() {
        return productoAlmacenRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Optional<ProductoAlmacen> findById(ProductoAlmacenId id) {
        return productoAlmacenRepository.findById(id);
    }
}
