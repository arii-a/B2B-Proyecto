package com.example.B2BProyect.service;

import com.example.B2BProyect.repository.EmpresaRepository;
import com.example.B2BProyect.repository.dto.request.EmpresaRequest;
import com.example.B2BProyect.repository.dto.response.EmpresaDTO;
import com.example.B2BProyect.repository.entity.Empresa;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@AllArgsConstructor
public class EmpresaService {
    private final EmpresaRepository empresaRepository;

    @Transactional
    public void save(EmpresaRequest empresaDTO) {
        Empresa empresa = new Empresa();
        empresa.setNombre(empresaDTO.getNombre());
        empresa.setDominio(empresaDTO.getDominio());
        empresa.setActivo(true);
        empresa.setNit(empresaDTO.getNit());
        empresa.setRazonSocial(empresaDTO.getRazonSocial());
        this.empresaRepository.save(empresa);
    }

    @Transactional(readOnly = true)
    public List<EmpresaDTO> findAll() {
        return empresaRepository.findAllDTO();
    }

    @Transactional(readOnly = true)
    public Optional<Empresa> findById(UUID id) {
        return empresaRepository.findById(id);
    }

    @Transactional(readOnly = true)
    public Optional<EmpresaDTO> findByIdDTO(UUID id) {
        return empresaRepository.findByIdDTO(id);
    }

    @Transactional(readOnly = true)
    public Optional<EmpresaDTO> findByName(String nombre) {
        return empresaRepository.findByNameDTO(nombre);
    }
}
