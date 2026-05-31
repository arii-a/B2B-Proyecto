package com.example.B2BProyect.service;

import com.example.B2BProyect.repository.ComisionRepository;
import com.example.B2BProyect.repository.DetalleOrdenRepository;
import com.example.B2BProyect.repository.dto.request.ComisionRequest;
import com.example.B2BProyect.repository.dto.response.ComisionDTO;
import com.example.B2BProyect.repository.entity.Comision;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@AllArgsConstructor
public class ComisionService {
    private final ComisionRepository comisionRepository;
    private final DetalleOrdenRepository detalleOrdenRepository;
    private final ProveedorService proveedorService;
    private final ReglasComisionService reglasComisionService;

    @Transactional
    public void save(ComisionRequest request) {
        Comision comision = new Comision();
        comision.setMontoComision(request.getMontoComision());
        comision.setMontoProveedor(request.getMontoProveedor());
        comision.setFecha(request.getFecha());
        if (request.getIdDetalleOrden() != null) {
            detalleOrdenRepository.findById(request.getIdDetalleOrden()).ifPresent(comision::setIdDetalleOrden);
        }
        if (request.getIdProveedor() != null) {
            proveedorService.findById(request.getIdProveedor()).ifPresent(comision::setIdProveedor);
        }
        if (request.getIdReglaComision() != null) {
            reglasComisionService.findById(request.getIdReglaComision()).ifPresent(comision::setIdReglaComision);
        }
        comisionRepository.save(comision);
    }

    @Transactional(readOnly = true)
    public List<ComisionDTO> findAll() {
        return comisionRepository.findAll().stream().map(ComisionDTO::new).toList();
    }

    @Transactional(readOnly = true)
    public Optional<Comision> findById(UUID id) {
        return comisionRepository.findById(id);
    }
}
