package com.example.B2BProyect.service;

import com.example.B2BProyect.repository.ContactosEmpresaRepository;
import com.example.B2BProyect.repository.dto.request.ContactosEmpresaRequest;
import com.example.B2BProyect.repository.dto.response.ContactosEmpresaDTO;
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
    private final CargoEmpresaService cargoEmpresaService;
    private final EmpresaService empresaService;

    @Transactional
    public void save(ContactosEmpresaRequest request) {
        ContactosEmpresa contacto = new ContactosEmpresa();
        contacto.setNombres(request.getNombres());
        contacto.setApellidos(request.getApellidos());
        if (request.getIdCargoEmpresa() != null)
            cargoEmpresaService.findById(request.getIdCargoEmpresa()).ifPresent(contacto::setIdCargoEmpresa);
        if (request.getIdEmpresa() != null)
            empresaService.findById(request.getIdEmpresa()).ifPresent(contacto::setIdEmpresa);
        contactosEmpresaRepository.save(contacto);
    }

    @Transactional(readOnly = true)
    public List<ContactosEmpresaDTO> findAll() {
        return contactosEmpresaRepository.findAll().stream().map(ContactosEmpresaDTO::new).toList();
    }

    @Transactional(readOnly = true)
    public Optional<ContactosEmpresa> findById(UUID id) {
        return contactosEmpresaRepository.findById(id);
    }

    @Transactional
    public Optional<ContactosEmpresaDTO> update(UUID id, ContactosEmpresaRequest dto) {
        return contactosEmpresaRepository.findById(id).map(contacto -> {
            if (dto.getNombres() != null)    contacto.setNombres(dto.getNombres());
            if (dto.getApellidos() != null)  contacto.setApellidos(dto.getApellidos());
            if (dto.getIdCargoEmpresa() != null)
                cargoEmpresaService.findById(dto.getIdCargoEmpresa()).ifPresent(contacto::setIdCargoEmpresa);
            if (dto.getIdEmpresa() != null)
                empresaService.findById(dto.getIdEmpresa()).ifPresent(contacto::setIdEmpresa);
            return new ContactosEmpresaDTO(contactosEmpresaRepository.save(contacto));
        });
    }

    @Transactional
    public boolean delete(UUID id) {
        if (!contactosEmpresaRepository.existsById(id)) return false;
        contactosEmpresaRepository.deleteById(id);
        return true;
    }
}
