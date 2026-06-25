package com.example.B2BProyect.service;

import com.example.B2BProyect.repository.ProductoAlmacenRepository;
import com.example.B2BProyect.repository.UsuarioRepository;
import com.example.B2BProyect.repository.dto.request.ProductoAlmacenRequest;
import com.example.B2BProyect.repository.dto.response.ProductoAlmacenDTO;
import com.example.B2BProyect.repository.entity.ProductoAlmacen;
import com.example.B2BProyect.repository.entity.ProductoAlmacenId;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
@AllArgsConstructor
public class ProductoAlmacenService {
    private final ProductoAlmacenRepository productoAlmacenRepository;
    private final AlmacenService almacenService;
    private final ProductoService productoService;
    private final UsuarioRepository usuarioRepository;
    private final EmailService emailService;

    @Transactional
    public void save(ProductoAlmacenRequest request) {
        ProductoAlmacen productoAlmacen = new ProductoAlmacen();
        ProductoAlmacenId id = new ProductoAlmacenId();
        id.setIdAlmacen(request.getIdAlmacen());
        id.setIdProducto(request.getIdProducto());
        productoAlmacen.setId(id);
        productoAlmacen.setStock(request.getStock());
        productoAlmacen.setMax(request.getMax());
        productoAlmacen.setMin(request.getMin());
        productoAlmacen.setActivo(request.getActivo());
        almacenService.findById(request.getIdAlmacen()).ifPresent(productoAlmacen::setAlmacen);
        productoService.findById(request.getIdProducto()).ifPresent(productoAlmacen::setProducto);
        productoAlmacenRepository.save(productoAlmacen);
    }

    @Transactional(readOnly = true)
    public List<ProductoAlmacenDTO> findAll() {
        return productoAlmacenRepository.findAll().stream().map(ProductoAlmacenDTO::new).toList();
    }

    @Transactional(readOnly = true)
    public List<ProductoAlmacenDTO> findByAlmacen(UUID idAlmacen) {
        return productoAlmacenRepository.findByAlmacenDTO(idAlmacen);
    }

    @Transactional(readOnly = true)
    public Optional<ProductoAlmacen> findById(ProductoAlmacenId id) {
        return productoAlmacenRepository.findById(id);
    }

    @Transactional
    public Optional<ProductoAlmacenDTO> update(ProductoAlmacenId id, ProductoAlmacenRequest dto) {
        return productoAlmacenRepository.findById(id).map(pa -> {
            Integer oldStock = pa.getStock();
            BigDecimal oldMin = pa.getMin();

            if (dto.getStock() != null)  pa.setStock(dto.getStock());
            if (dto.getMax() != null)    pa.setMax(dto.getMax());
            if (dto.getMin() != null)    pa.setMin(dto.getMin());
            if (dto.getActivo() != null) pa.setActivo(dto.getActivo());

            ProductoAlmacen saved = productoAlmacenRepository.save(pa);

            // Alert when stock crosses below minimum threshold
            if (dto.getStock() != null && saved.getMin() != null) {
                int newStock = saved.getStock();
                int minStock = saved.getMin().intValue();
                boolean wasAbove = oldStock == null || oldMin == null || oldStock >= oldMin.intValue();
                if (newStock < minStock && wasAbove) {
                    try {
                        String productoNombre = saved.getProducto() != null ? saved.getProducto().getNombre() : "Desconocido";
                        String almacenNombre  = saved.getAlmacen()  != null ? saved.getAlmacen().getNombre()  : null;
                        if (saved.getProducto() != null
                                && saved.getProducto().getIdProveedor() != null
                                && saved.getProducto().getIdProveedor().getIdEmpresa() != null) {
                            UUID empresaId = saved.getProducto().getIdProveedor().getIdEmpresa().getId();
                            var usuarios = usuarioRepository.findByIdEmpresaId(empresaId);
                            log.info("[STOCK] Producto '{}' bajo mínimo ({}/{}) — alertando a {} usuario(s)", productoNombre, newStock, minStock, usuarios.size());
                            usuarios.forEach(u -> emailService.sendStockAlerta(u.getEmail(), productoNombre, newStock, minStock, almacenNombre));
                        }
                    } catch (Exception e) {
                        log.warn("[STOCK] No se pudo enviar alerta de stock: {}", e.getMessage());
                    }
                }
            }

            return new ProductoAlmacenDTO(saved);
        });
    }

    @Transactional
    public boolean delete(ProductoAlmacenId id) {
        if (!productoAlmacenRepository.existsById(id)) return false;
        productoAlmacenRepository.deleteById(id);
        return true;
    }

    /**
     * Descuenta `cantidad` unidades del stock del producto, empezando por el almacén
     * con más stock. Dispara la alerta por email si algún almacén cruza por debajo del mínimo.
     */
    @Transactional
    public void decrementarStock(UUID idProducto, int cantidad) {
        if (idProducto == null || cantidad <= 0) return;
        var almacenes = productoAlmacenRepository.findActivosByProducto(idProducto);
        int restante = cantidad;
        for (var pa : almacenes) {
            if (restante <= 0) break;
            int oldStock = pa.getStock();
            int deducir  = Math.min(restante, Math.max(0, oldStock));
            if (deducir == 0) continue;
            int newStock = oldStock - deducir;
            pa.setStock(newStock);
            restante -= deducir;
            productoAlmacenRepository.save(pa);

            if (pa.getMin() != null && newStock < pa.getMin().intValue() && oldStock >= pa.getMin().intValue()) {
                try {
                    String productoNombre = pa.getProducto() != null ? pa.getProducto().getNombre() : "Desconocido";
                    String almacenNombre  = pa.getAlmacen()  != null ? pa.getAlmacen().getNombre()  : null;
                    int    minStock       = pa.getMin().intValue();
                    if (pa.getProducto() != null
                            && pa.getProducto().getIdProveedor() != null
                            && pa.getProducto().getIdProveedor().getIdEmpresa() != null) {
                        UUID empresaId = pa.getProducto().getIdProveedor().getIdEmpresa().getId();
                        var  usuarios  = usuarioRepository.findByIdEmpresaId(empresaId);
                        log.info("[STOCK] '{}' bajo mínimo ({}/{}) vía pedido — alertando {} usuario(s)",
                                productoNombre, newStock, minStock, usuarios.size());
                        usuarios.forEach(u -> emailService.sendStockAlerta(
                                u.getEmail(), productoNombre, newStock, minStock, almacenNombre));
                    }
                } catch (Exception e) {
                    log.warn("[STOCK] No se pudo enviar alerta de stock: {}", e.getMessage());
                }
            }
        }
    }
}
