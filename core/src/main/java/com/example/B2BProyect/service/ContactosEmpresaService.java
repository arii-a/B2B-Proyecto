package com.example.B2BProyect.service;

import com.example.B2BProyect.repository.ContactosEmpresaRepository;
import com.example.B2BProyect.repository.entity.ContactosEmpresa;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@AllArgsConstructor
public class ContactosEmpresaService {
    private final ContactosEmpresaRepository contactosEmpresaRepository;

    @Transactional
    public void save(ContactosEmpresa contactosEmpresa) {
        contactosEmpresaRepository.save(contactosEmpresa);
    }

    @Transactional(readOnly = true)
    public List<ContactosEmpresa> findAll() {
        return contactosEmpresaRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Optional<ContactosEmpresa> findById(UUID id) {
        return contactosEmpresaRepository.findById(id);
    }
}
