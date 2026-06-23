package com.example.B2BProyect.service;

import com.example.B2BProyect.repository.UnidadMedidaRepository;
import com.example.B2BProyect.repository.dto.request.UnidadMedidaRequest;
import com.example.B2BProyect.repository.dto.response.UnidadMedidaDTO;
import com.example.B2BProyect.repository.entity.UnidadMedida;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@AllArgsConstructor
public class UnidadMedidaService {

    private final UnidadMedidaRepository unidadMedidaRepository;

    @Transactional
    public UnidadMedidaDTO save(UnidadMedidaRequest request) {
        UnidadMedida u = new UnidadMedida();
        u.setNombre(request.getNombre());
        u.setAbreviatura(request.getAbreviatura());
        u.setActivo(request.getActivo() != null ? request.getActivo() : true);
        return new UnidadMedidaDTO(unidadMedidaRepository.save(u));
    }

    @Transactional(readOnly = true)
    public List<UnidadMedidaDTO> findAll() {
        return unidadMedidaRepository.findAll().stream().map(UnidadMedidaDTO::new).toList();
    }

    @Transactional(readOnly = true)
    public List<UnidadMedidaDTO> findAllActivas() {
        return unidadMedidaRepository.findAllByActivoTrue().stream().map(UnidadMedidaDTO::new).toList();
    }

    @Transactional(readOnly = true)
    public Optional<UnidadMedida> findById(UUID id) {
        return unidadMedidaRepository.findById(id);
    }

    @Transactional
    public Optional<UnidadMedidaDTO> update(UUID id, UnidadMedidaRequest request) {
        return unidadMedidaRepository.findById(id).map(u -> {
            if (request.getNombre() != null)      u.setNombre(request.getNombre());
            if (request.getAbreviatura() != null)  u.setAbreviatura(request.getAbreviatura());
            if (request.getActivo() != null)       u.setActivo(request.getActivo());
            return new UnidadMedidaDTO(unidadMedidaRepository.save(u));
        });
    }

    @Transactional
    public boolean delete(UUID id) {
        if (!unidadMedidaRepository.existsById(id)) return false;
        unidadMedidaRepository.deleteById(id);
        return true;
    }
}
