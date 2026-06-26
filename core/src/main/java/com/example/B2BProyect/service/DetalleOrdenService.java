package com.example.B2BProyect.service;

import com.example.B2BProyect.repository.DetalleOrdenRepository;
import com.example.B2BProyect.repository.dto.request.DetalleOrdenRequest;
import com.example.B2BProyect.repository.dto.response.DetalleOrdenDTO;
import com.example.B2BProyect.repository.entity.DetalleOrden;
import com.example.B2BProyect.repository.entity.Usuario;
import lombok.AllArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
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
    private final ProductoAlmacenService productoAlmacenService;

    private boolean isDiscountUser() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof Usuario u)) return false;
        return "rllayus".equals(u.getNombre()) || "rllayus@gmail.com".equals(u.getEmail());
    }

    private BigDecimal applyDiscount(BigDecimal price) {
        if (price == null) return null;
        return price.multiply(BigDecimal.valueOf(0.90));
    }

    @Transactional
    public void save(DetalleOrdenRequest request) {
        DetalleOrden detalle = new DetalleOrden();
        detalle.setCantidad(request.getCantidad());
        BigDecimal precioUnitario = request.getPrecioUnitario();
        if (isDiscountUser()) {
            precioUnitario = applyDiscount(precioUnitario);
        }
        detalle.setPrecioUnitario(precioUnitario);
        BigDecimal subtotal = (precioUnitario != null && request.getCantidad() != null)
                ? precioUnitario.multiply(BigDecimal.valueOf(request.getCantidad()))
                : request.getSubtotal();
        detalle.setSubtotal(subtotal);
        if (request.getIdOrden() != null)
            ordenCompraService.findById(request.getIdOrden()).ifPresent(detalle::setIdOrden);
        if (request.getIdProducto() != null)
            productoService.findById(request.getIdProducto()).ifPresent(detalle::setIdProducto);
        if (request.getIdAlmacen() != null)
            almacenService.findById(request.getIdAlmacen()).ifPresent(detalle::setAlmacen);
        detalleOrdenRepository.save(detalle);

        if (request.getIdProducto() != null && request.getCantidad() != null && request.getCantidad() > 0)
            productoAlmacenService.decrementarStock(request.getIdProducto(), request.getCantidad());
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
            if (dto.getPrecioUnitario() != null) {
                BigDecimal precio = isDiscountUser() ? applyDiscount(dto.getPrecioUnitario()) : dto.getPrecioUnitario();
                detalle.setPrecioUnitario(precio);
                Integer cantidad = dto.getCantidad() != null ? dto.getCantidad() : detalle.getCantidad();
                if (cantidad != null) detalle.setSubtotal(precio.multiply(BigDecimal.valueOf(cantidad)));
            } else if (dto.getSubtotal() != null) detalle.setSubtotal(dto.getSubtotal());
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
