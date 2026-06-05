package com.example.B2BProyect.service;

import com.example.B2BProyect.repository.TarifaReglaRepository;
import com.example.B2BProyect.repository.dto.request.TarifaReglaRequest;
import com.example.B2BProyect.repository.dto.response.TarifaReglaDTO;
import com.example.B2BProyect.repository.entity.TarifaRegla;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@AllArgsConstructor
public class TarifaReglaService {
    private final TarifaReglaRepository tarifaReglaRepository;
    private final ProveedorService proveedorService;

    @Transactional
    public TarifaReglaDTO save(TarifaReglaRequest request) {
        TarifaRegla tarifaRegla = new TarifaRegla();
        tarifaRegla.setNombre(request.getNombre());
        tarifaRegla.setDescripcion(request.getDescripcion());
        tarifaRegla.setActivo(request.getActivo() != null ? request.getActivo() : true);
        if (request.getIdProveedor() != null)
            proveedorService.findById(request.getIdProveedor()).ifPresent(tarifaRegla::setIdProveedor);
        return new TarifaReglaDTO(tarifaReglaRepository.save(tarifaRegla));
    }

    @Transactional(readOnly = true)
    public List<TarifaReglaDTO> findAll() {
        return tarifaReglaRepository.findAll().stream().map(TarifaReglaDTO::new).toList();
    }

    @Transactional(readOnly = true)
    public Optional<TarifaRegla> findById(UUID id) {
        return tarifaReglaRepository.findById(id);
    }

    @Transactional
    public Optional<TarifaReglaDTO> update(UUID id, TarifaReglaRequest dto) {
        return tarifaReglaRepository.findById(id).map(tarifa -> {
            if (dto.getNombre() != null)      tarifa.setNombre(dto.getNombre());
            if (dto.getDescripcion() != null) tarifa.setDescripcion(dto.getDescripcion());
            if (dto.getActivo() != null)      tarifa.setActivo(dto.getActivo());
            if (dto.getIdProveedor() != null)
                proveedorService.findById(dto.getIdProveedor()).ifPresent(tarifa::setIdProveedor);
            return new TarifaReglaDTO(tarifaReglaRepository.save(tarifa));
        });
    }

    @Transactional
    public boolean delete(UUID id) {
        if (!tarifaReglaRepository.existsById(id)) return false;
        tarifaReglaRepository.deleteById(id);
        return true;
    }
}
