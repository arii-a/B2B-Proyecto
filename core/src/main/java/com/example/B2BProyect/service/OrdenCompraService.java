package com.example.B2BProyect.service;

import com.example.B2BProyect.repository.OrdenCompraRepository;
import com.example.B2BProyect.repository.dto.request.OrdenCompraRequest;
import com.example.B2BProyect.repository.dto.response.OrdenCompraDTO;
import com.example.B2BProyect.repository.entity.OrdenCompra;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
    public Optional<OrdenCompra> findById(UUID id) {
        return ordenCompraRepository.findById(id);
    }

    @Transactional
    public Optional<OrdenCompraDTO> update(UUID id, OrdenCompraRequest dto) {
        return ordenCompraRepository.findById(id).map(orden -> {
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
            return new OrdenCompraDTO(ordenCompraRepository.save(orden));
        });
    }

    @Transactional
    public boolean delete(UUID id) {
        if (!ordenCompraRepository.existsById(id)) return false;
        ordenCompraRepository.deleteById(id);
        return true;
    }
}
