package com.example.B2BProyect.service;

import com.example.B2BProyect.repository.DetalleOrdenRepository;
import com.example.B2BProyect.repository.dto.request.DetalleOrdenRequest;
import com.example.B2BProyect.repository.dto.response.DetalleOrdenDTO;
import com.example.B2BProyect.repository.entity.DetalleOrden;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@AllArgsConstructor
public class DetalleOrdenService {
    private final DetalleOrdenRepository detalleOrdenRepository;
    private final OrdenCompraService ordenCompraService;
    private final ProductoService productoService;
    private final AlmacenService almacenService;

    @Transactional
    public void save(DetalleOrdenRequest request) {
        DetalleOrden detalle = new DetalleOrden();
        detalle.setCantidad(request.getCantidad());
        detalle.setPrecioUnitario(request.getPrecioUnitario());
        detalle.setSubtotal(request.getSubtotal());
        if (request.getIdOrden() != null)
            ordenCompraService.findById(request.getIdOrden()).ifPresent(detalle::setIdOrden);
        if (request.getIdProducto() != null)
            productoService.findById(request.getIdProducto()).ifPresent(detalle::setIdProducto);
        if (request.getIdAlmacen() != null)
            almacenService.findById(request.getIdAlmacen()).ifPresent(detalle::setAlmacen);
        detalleOrdenRepository.save(detalle);
    }

    @Transactional(readOnly = true)
    public List<DetalleOrdenDTO> findAll() {
        return detalleOrdenRepository.findAll().stream().map(DetalleOrdenDTO::new).toList();
    }

    @Transactional(readOnly = true)
    public Optional<DetalleOrden> findById(UUID id) {
        return detalleOrdenRepository.findById(id);
    }

    @Transactional
    public Optional<DetalleOrdenDTO> update(UUID id, DetalleOrdenRequest dto) {
        return detalleOrdenRepository.findById(id).map(detalle -> {
            if (dto.getCantidad() != null)       detalle.setCantidad(dto.getCantidad());
            if (dto.getPrecioUnitario() != null) detalle.setPrecioUnitario(dto.getPrecioUnitario());
            if (dto.getSubtotal() != null)       detalle.setSubtotal(dto.getSubtotal());
            if (dto.getIdOrden() != null)
                ordenCompraService.findById(dto.getIdOrden()).ifPresent(detalle::setIdOrden);
            if (dto.getIdProducto() != null)
                productoService.findById(dto.getIdProducto()).ifPresent(detalle::setIdProducto);
            if (dto.getIdAlmacen() != null)
                almacenService.findById(dto.getIdAlmacen()).ifPresent(detalle::setAlmacen);
            return new DetalleOrdenDTO(detalleOrdenRepository.save(detalle));
        });
    }

    @Transactional
    public boolean delete(UUID id) {
        if (!detalleOrdenRepository.existsById(id)) return false;
        detalleOrdenRepository.deleteById(id);
        return true;
    }
}
