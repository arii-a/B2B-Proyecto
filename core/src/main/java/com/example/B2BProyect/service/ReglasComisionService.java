package com.example.B2BProyect.service;

import com.example.B2BProyect.repository.ReglasComisionRepository;
import com.example.B2BProyect.repository.dto.request.ReglasComisionRequest;
import com.example.B2BProyect.repository.dto.response.ReglasComisionDTO;
import com.example.B2BProyect.repository.entity.ReglasComision;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@AllArgsConstructor
public class ReglasComisionService {
    private final ReglasComisionRepository reglasComisionRepository;
    private final ProveedorService proveedorService;

    @Transactional
    public void save(ReglasComisionRequest request) {
        ReglasComision regla = new ReglasComision();
        regla.setNombre(request.getNombre());
        regla.setIdTipo(request.getIdTipo());
        regla.setValor(request.getValor());
        regla.setActiva(request.getActiva());
        regla.setFechaInicio(request.getFechaInicio());
        regla.setFechaFinal(request.getFechaFinal());
        if (request.getIdProveedor() != null) {
            proveedorService.findById(request.getIdProveedor()).ifPresent(regla::setIdProveedor);
        }
        reglasComisionRepository.save(regla);
    }

    @Transactional(readOnly = true)
    public List<ReglasComisionDTO> findAll() {
        return reglasComisionRepository.findAll().stream().map(ReglasComisionDTO::new).toList();
    }

    @Transactional(readOnly = true)
    public Optional<ReglasComision> findById(UUID id) {
        return reglasComisionRepository.findById(id);
    }
}
