package com.example.B2BProyect.service;

import com.example.B2BProyect.repository.ContratoEmpresaDetalleRepository;
import com.example.B2BProyect.repository.dto.request.ContratoEmpresaDetalleRequest;
import com.example.B2BProyect.repository.dto.response.ContratoEmpresaDetalleDTO;
import com.example.B2BProyect.repository.entity.ContratoEmpresaDetalle;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@AllArgsConstructor
public class ContratoEmpresaDetalleService {
    private final ContratoEmpresaDetalleRepository contratoEmpresaDetalleRepository;
    private final ProductoService productoService;
    private final ContratoEmpresaTarifaService contratoEmpresaTarifaService;

    @Transactional
    public void save(ContratoEmpresaDetalleRequest request) {
        ContratoEmpresaDetalle detalle = new ContratoEmpresaDetalle();
        detalle.setPorcentajeDescuento(request.getPorcentajeDescuento());
        if (request.getIdProducto() != null)
            productoService.findById(request.getIdProducto()).ifPresent(detalle::setIdProducto);
        if (request.getIdContrato() != null)
            contratoEmpresaTarifaService.findById(request.getIdContrato()).ifPresent(detalle::setIdContrato);
        contratoEmpresaDetalleRepository.save(detalle);
    }

    @Transactional(readOnly = true)
    public List<ContratoEmpresaDetalleDTO> findAll() {
        return contratoEmpresaDetalleRepository.findAll().stream().map(ContratoEmpresaDetalleDTO::new).toList();
    }

    @Transactional(readOnly = true)
    public Optional<ContratoEmpresaDetalle> findById(UUID id) {
        return contratoEmpresaDetalleRepository.findById(id);
    }

    @Transactional
    public Optional<ContratoEmpresaDetalleDTO> update(UUID id, ContratoEmpresaDetalleRequest dto) {
        return contratoEmpresaDetalleRepository.findById(id).map(detalle -> {
            if (dto.getPorcentajeDescuento() != null) detalle.setPorcentajeDescuento(dto.getPorcentajeDescuento());
            if (dto.getIdProducto() != null)
                productoService.findById(dto.getIdProducto()).ifPresent(detalle::setIdProducto);
            if (dto.getIdContrato() != null)
                contratoEmpresaTarifaService.findById(dto.getIdContrato()).ifPresent(detalle::setIdContrato);
            return new ContratoEmpresaDetalleDTO(contratoEmpresaDetalleRepository.save(detalle));
        });
    }

    @Transactional
    public boolean delete(UUID id) {
        if (!contratoEmpresaDetalleRepository.existsById(id)) return false;
        contratoEmpresaDetalleRepository.deleteById(id);
        return true;
    }
}
