package com.example.B2BProyect.service;

import com.example.B2BProyect.repository.OrdenCompraRepository;
import com.example.B2BProyect.repository.dto.request.OrdenCompraRequest;
import com.example.B2BProyect.repository.dto.response.OrdenCompraDTO;
import com.example.B2BProyect.repository.entity.OrdenCompra;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@AllArgsConstructor
public class OrdenCompraService {
    private final OrdenCompraRepository ordenCompraRepository;
    private final ProveedorService proveedorService;
    private final EmpresaService empresaService;
    private final SucursalEmpresaService sucursalEmpresaService;
    private final UsuarioService usuarioService;

    @Transactional
    public void save(OrdenCompraRequest request) {
        OrdenCompra orden = new OrdenCompra();
        orden.setTotal(request.getTotal());
        orden.setFecha(request.getFecha());
        orden.setFechaOrden(request.getFechaOrden());
        orden.setIdEstado(request.getIdEstado());
        if (request.getIdProveedor() != null) {
            proveedorService.findById(request.getIdProveedor()).ifPresent(orden::setIdProveedor);
        }
        if (request.getIdEmpresaCompradora() != null) {
            empresaService.findById(request.getIdEmpresaCompradora()).ifPresent(orden::setIdEmpresaCompradora);
        }
        if (request.getIdSucursal() != null) {
            sucursalEmpresaService.findById(request.getIdSucursal()).ifPresent(orden::setIdSucursal);
        }
        if (request.getIdUsuario() != null) {
            usuarioService.findById(request.getIdUsuario()).ifPresent(orden::setIdUsuario);
        }
        ordenCompraRepository.save(orden);
    }

    @Transactional(readOnly = true)
    public List<OrdenCompraDTO> findAll() {
        return ordenCompraRepository.findAll().stream().map(OrdenCompraDTO::new).toList();
    }

    @Transactional(readOnly = true)
    public Optional<OrdenCompra> findById(UUID id) {
        return ordenCompraRepository.findById(id);
    }
}
