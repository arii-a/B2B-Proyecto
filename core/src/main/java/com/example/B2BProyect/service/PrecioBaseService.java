package com.example.B2BProyect.service;

import com.example.B2BProyect.repository.PrecioBaseRepository;
import com.example.B2BProyect.repository.dto.request.PrecioBaseRequest;
import com.example.B2BProyect.repository.dto.response.PrecioBaseDTO;
import com.example.B2BProyect.repository.entity.PrecioBase;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@AllArgsConstructor
public class PrecioBaseService {
    private final PrecioBaseRepository precioBaseRepository;
    private final ProveedorService proveedorService;
    private final ProductoService productoService;

    @Transactional
    public void save(PrecioBaseRequest request) {
        PrecioBase precioBase = new PrecioBase();
        precioBase.setPrecioBase(request.getPrecioBase());
        precioBase.setVigenteDesde(request.getVigenteDesde());
        precioBase.setVigenteHasta(request.getVigenteHasta());
        if (request.getIdProveedor() != null) {
            proveedorService.findById(request.getIdProveedor()).ifPresent(precioBase::setIdProveedor);
        }
        if (request.getIdProducto() != null) {
            productoService.findById(request.getIdProducto()).ifPresent(precioBase::setIdProducto);
        }
        precioBaseRepository.save(precioBase);
    }

    @Transactional(readOnly = true)
    public List<PrecioBaseDTO> findAll() {
        return precioBaseRepository.findAll().stream().map(PrecioBaseDTO::new).toList();
    }

    @Transactional(readOnly = true)
    public Optional<PrecioBase> findById(UUID id) {
        return precioBaseRepository.findById(id);
    }
}
