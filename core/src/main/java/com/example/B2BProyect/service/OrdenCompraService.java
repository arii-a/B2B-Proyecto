package com.example.B2BProyect.service;

import com.example.B2BProyect.repository.DetalleOrdenRepository;
import com.example.B2BProyect.repository.OrdenCompraRepository;
import com.example.B2BProyect.repository.ProductoAlmacenRepository;
import com.example.B2BProyect.repository.dto.request.OrdenCompraRequest;
import com.example.B2BProyect.repository.dto.response.OrdenCompraDTO;
import com.example.B2BProyect.repository.dto.response.OrdenCompraResumenDTO;
import com.example.B2BProyect.repository.entity.OrdenCompra;
import com.example.B2BProyect.repository.entity.ProductoAlmacenId;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
@AllArgsConstructor
public class OrdenCompraService {
    private final OrdenCompraRepository ordenCompraRepository;
    private final ProveedorService proveedorService;
    private final EmpresaService empresaService;
    private final SucursalEmpresaService sucursalEmpresaService;
    private final UsuarioService usuarioService;
    private final DetalleOrdenRepository detalleOrdenRepository;
    private final ProductoAlmacenRepository productoAlmacenRepository;
    private final EmailService emailService;

    @Transactional
    public OrdenCompraDTO save(OrdenCompraRequest request, UUID idempotency) {
        OrdenCompra orden = new OrdenCompra();
        orden.setTotal(request.getTotal());
        orden.setFecha(request.getFecha());
        orden.setFechaOrden(request.getFechaOrden());
        orden.setId(idempotency);
        log.info("ORDEN A GUARDAR: " + orden.getId());
        orden.setIdEstado(request.getIdEstado() != null ? request.getIdEstado() : "pendiente");
        if (request.getIdProveedor() != null)
            proveedorService.findById(request.getIdProveedor()).ifPresent(orden::setIdProveedor);
        if (request.getIdEmpresaCompradora() != null)
            empresaService.findById(request.getIdEmpresaCompradora()).ifPresent(orden::setIdEmpresaCompradora);
        if (request.getIdSucursal() != null)
            sucursalEmpresaService.findById(request.getIdSucursal()).ifPresent(orden::setIdSucursal);
        if (request.getIdUsuario() != null)
            usuarioService.findById(request.getIdUsuario()).ifPresent(orden::setIdUsuario);
        return new OrdenCompraDTO(ordenCompraRepository.save(orden));
    }

    @Transactional(readOnly = true)
    public List<OrdenCompraDTO> findAll() {
        return ordenCompraRepository.findAll().stream().map(OrdenCompraDTO::new).toList();
    }

    @Transactional(readOnly = true)
    public List<OrdenCompraDTO> findByEmpresaCompradora(UUID idEmpresa) {
        return ordenCompraRepository.findByEmpresaCompradora(idEmpresa).stream().map(OrdenCompraDTO::new).toList();
    }

    @Transactional(readOnly = true)
    public List<OrdenCompraDTO> findByProveedorEmpresa(UUID idEmpresa) {
        return ordenCompraRepository.findByProveedorEmpresa(idEmpresa).stream().map(OrdenCompraDTO::new).toList();
    }

    @Transactional(readOnly = true)
    public Optional<OrdenCompra> findById(UUID id) {
        return ordenCompraRepository.findById(id);
    }

    @Transactional
    public Optional<OrdenCompraDTO> update(UUID id, OrdenCompraRequest dto) {
        return ordenCompraRepository.findById(id).map(orden -> {
            boolean aprobandoAhora = "aprobado".equals(dto.getIdEstado())
                    && !"aprobado".equals(orden.getIdEstado());

            if (dto.getTotal() != null)      orden.setTotal(dto.getTotal());
            if (dto.getFecha() != null)      orden.setFecha(dto.getFecha());
            if (dto.getFechaOrden() != null) orden.setFechaOrden(dto.getFechaOrden());
            if (dto.getIdEstado() != null)   orden.setIdEstado(dto.getIdEstado());
            if (dto.getIdProveedor() != null)
                proveedorService.findById(dto.getIdProveedor()).ifPresent(orden::setIdProveedor);
            if (dto.getIdEmpresaCompradora() != null)
                empresaService.findById(dto.getIdEmpresaCompradora()).ifPresent(orden::setIdEmpresaCompradora);
            if (dto.getIdSucursal() != null)
                sucursalEmpresaService.findById(dto.getIdSucursal()).ifPresent(orden::setIdSucursal);
            if (dto.getIdUsuario() != null)
                usuarioService.findById(dto.getIdUsuario()).ifPresent(orden::setIdUsuario);

            OrdenCompraDTO saved = new OrdenCompraDTO(ordenCompraRepository.save(orden));

            if (aprobandoAhora) {
                descontarStock(id);
            }

            return saved;
        });
    }

    private void descontarStock(UUID ordenId) {
        detalleOrdenRepository.findByOrden(ordenId).forEach(detalle -> {
            UUID productoId = detalle.getIdProducto().getId();
            UUID almacenId = detalle.getAlmacen() != null ? detalle.getAlmacen().getId() : null;

            if (almacenId == null) {
                log.warn("[STOCK] Detalle sin almacen para producto {}, buscando el primero disponible", productoId);
                productoAlmacenRepository.findByProductoDTO(productoId).stream()
                        .findFirst()
                        .ifPresent(pa -> {
                            ProductoAlmacenId paId = new ProductoAlmacenId();
                            paId.setIdAlmacen(pa.getIdAlmacen());
                            paId.setIdProducto(productoId);
                            productoAlmacenRepository.findById(paId).ifPresent(entity -> {
                                int nuevoStock = Math.max(0, entity.getStock() - detalle.getCantidad());
                                entity.setStock(nuevoStock);
                                productoAlmacenRepository.save(entity);
                                log.info("[STOCK] Producto {} stock {} -> {}", productoId, entity.getStock() + detalle.getCantidad(), nuevoStock);
                            });
                        });
                return;
            }

            ProductoAlmacenId paId = new ProductoAlmacenId();
            paId.setIdAlmacen(almacenId);
            paId.setIdProducto(productoId);
            productoAlmacenRepository.findById(paId).ifPresent(entity -> {
                int nuevoStock = Math.max(0, entity.getStock() - detalle.getCantidad());
                entity.setStock(nuevoStock);
                productoAlmacenRepository.save(entity);
                log.info("[STOCK] Producto {} almacen {} stock {} -> {}", productoId, almacenId, entity.getStock() + detalle.getCantidad(), nuevoStock);
            });
        });
    }

    @Transactional
    public int cancelarOrdenesPendientesVencidas(int minutosLimite) {
        LocalDateTime limite = LocalDateTime.now().minusMinutes(minutosLimite);
        List<OrdenCompra> vencidas = ordenCompraRepository.findPendientesVencidas(limite);
        vencidas.forEach(o -> o.setIdEstado("cancelado"));
        ordenCompraRepository.saveAll(vencidas);
        vencidas.forEach(o -> emailService.sendOrdenCancelada("rllayus@gmail.com"));
        if (!vencidas.isEmpty())
            log.info("[ORDEN-CANCEL] {} órdenes pendientes canceladas (límite: {} min)", vencidas.size(), minutosLimite);
        return vencidas.size();
    }



    @Transactional
    public boolean delete(UUID id) {
        if (!ordenCompraRepository.existsById(id)) return false;
        ordenCompraRepository.deleteById(id);
        return true;
    }

    @Transactional(readOnly = true)
    public Page<OrdenCompraDTO> findAllPaged(int page, int size) {
        return ordenCompraRepository.findAll(PageRequest.of(page, size)).map(OrdenCompraDTO::new);
    }




}
