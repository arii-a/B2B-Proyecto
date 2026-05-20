package com.example.B2BProyect.service;

import com.example.B2BProyect.repository.CatProveedorRepository;
import com.example.B2BProyect.repository.entity.CatProveedor;
import com.example.B2BProyect.repository.entity.CatProveedorId;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@AllArgsConstructor
public class CatProveedorService {
    private final CatProveedorRepository catProveedorRepository;

    @Transactional
    public void save(CatProveedor catProveedor) {
        catProveedorRepository.save(catProveedor);
    }

    @Transactional(readOnly = true)
    public List<CatProveedor> findAll() {
        return catProveedorRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Optional<CatProveedor> findById(CatProveedorId id) {
        return catProveedorRepository.findById(id);
    }
}
