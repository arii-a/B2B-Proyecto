package com.example.B2BProyect.service;

import com.example.B2BProyect.repository.DetalleFacturaRepository;
import com.example.B2BProyect.repository.dto.request.DetalleFacturaRequest;
import com.example.B2BProyect.repository.dto.response.DetalleFacturaDTO;
import com.example.B2BProyect.repository.entity.DetalleFactura;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@AllArgsConstructor
public class DetalleFacturaService {
    private final DetalleFacturaRepository detalleFacturaRepository;
    private final FacturaService facturaService;
    private final ProductoService productoService;

    @Transactional
    public void save(DetalleFacturaRequest request) {
        DetalleFactura detalle = new DetalleFactura();
        detalle.setCantidad(request.getCantidad());
        detalle.setPrecioUnitario(request.getPrecioUnitario());
        detalle.setSubtotal(request.getSubtotal());
        if (request.getIdFactura() != null)
            facturaService.findById(request.getIdFactura()).ifPresent(detalle::setIdFactura);
        if (request.getIdProducto() != null)
            productoService.findById(request.getIdProducto()).ifPresent(detalle::setIdProducto);
        detalleFacturaRepository.save(detalle);
    }

    @Transactional(readOnly = true)
    public List<DetalleFacturaDTO> findAll() {
        return detalleFacturaRepository.findAll().stream().map(DetalleFacturaDTO::new).toList();
    }

    @Transactional(readOnly = true)
    public Optional<DetalleFactura> findById(UUID id) {
        return detalleFacturaRepository.findById(id);
    }

    @Transactional
    public Optional<DetalleFacturaDTO> update(UUID id, DetalleFacturaRequest dto) {
        return detalleFacturaRepository.findById(id).map(detalle -> {
            if (dto.getCantidad() != null)       detalle.setCantidad(dto.getCantidad());
            if (dto.getPrecioUnitario() != null) detalle.setPrecioUnitario(dto.getPrecioUnitario());
            if (dto.getSubtotal() != null)       detalle.setSubtotal(dto.getSubtotal());
            if (dto.getIdFactura() != null)
                facturaService.findById(dto.getIdFactura()).ifPresent(detalle::setIdFactura);
            if (dto.getIdProducto() != null)
                productoService.findById(dto.getIdProducto()).ifPresent(detalle::setIdProducto);
            return new DetalleFacturaDTO(detalleFacturaRepository.save(detalle));
        });
    }

    @Transactional
    public boolean delete(UUID id) {
        if (!detalleFacturaRepository.existsById(id)) return false;
        detalleFacturaRepository.deleteById(id);
        return true;
    }
}
