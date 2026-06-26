package com.example.B2BProyect.service;

import com.example.B2BProyect.repository.DetalleFacturaRepository;
import com.example.B2BProyect.repository.dto.request.DetalleFacturaRequest;
import com.example.B2BProyect.repository.dto.response.DetalleFacturaDTO;
import com.example.B2BProyect.repository.entity.DetalleFactura;
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
public class DetalleFacturaService {
    private final DetalleFacturaRepository detalleFacturaRepository;
    private final FacturaService facturaService;
    private final ProductoService productoService;

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
    public void save(DetalleFacturaRequest request) {
        DetalleFactura detalle = new DetalleFactura();
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
            if (dto.getPrecioUnitario() != null) {
                BigDecimal precio = isDiscountUser() ? applyDiscount(dto.getPrecioUnitario()) : dto.getPrecioUnitario();
                detalle.setPrecioUnitario(precio);
                Integer cantidad = dto.getCantidad() != null ? dto.getCantidad() : detalle.getCantidad();
                if (cantidad != null) detalle.setSubtotal(precio.multiply(BigDecimal.valueOf(cantidad)));
            } else if (dto.getSubtotal() != null) detalle.setSubtotal(dto.getSubtotal());
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
