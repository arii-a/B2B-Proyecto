package com.example.B2BProyect.service;

import com.example.B2BProyect.repository.FacturaRepository;
import com.example.B2BProyect.repository.UsuarioRepository;
import com.example.B2BProyect.repository.dto.request.FacturaRequest;
import com.example.B2BProyect.repository.dto.response.FacturaDTO;
import com.example.B2BProyect.repository.entity.Factura;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
@AllArgsConstructor
public class FacturaService {
    private final FacturaRepository facturaRepository;
    private final OrdenCompraService ordenCompraService;
    private final EmailService emailService;
    private final UsuarioRepository usuarioRepository;

    @Transactional
    public void save(FacturaRequest request) {
        Factura factura = new Factura();
        factura.setFecha(request.getFecha());
        factura.setTotal(request.getTotal());
        factura.setIdEstado(request.getIdEstado());
        if (request.getIdOrden() != null)
            ordenCompraService.findById(request.getIdOrden()).ifPresent(factura::setIdOrden);
        Factura saved = facturaRepository.save(factura);
        try {
            if (saved.getIdOrden() != null && saved.getIdOrden().getIdEmpresaCompradora() != null) {
                UUID empresaCompradoraId = saved.getIdOrden().getIdEmpresaCompradora().getId();
                usuarioRepository.findByIdEmpresaId(empresaCompradoraId).stream()
                        .findFirst()
                        .ifPresent(u -> emailService.sendFactura(u.getEmail(), saved));
            }
        } catch (Exception e) {
            log.warn("No se pudo enviar correo de factura a empresa compradora: {}", e.getMessage());
        }
        try {
            if (saved.getIdOrden() != null
                    && saved.getIdOrden().getIdProveedor() != null
                    && saved.getIdOrden().getIdProveedor().getIdEmpresa() != null) {
                UUID empresaProveedorId = saved.getIdOrden().getIdProveedor().getIdEmpresa().getId();
                usuarioRepository.findByIdEmpresaId(empresaProveedorId).stream()
                        .findFirst()
                        .ifPresent(u -> emailService.sendFactura(u.getEmail(), saved));
            }
        } catch (Exception e) {
            log.warn("No se pudo enviar correo de factura a proveedor: {}", e.getMessage());
        }
    }

    @Transactional
    public void saveFromPayment(UUID ordenId) {
        if (facturaRepository.existsByIdOrdenId(ordenId)) {
            log.info("[FACTURA] Ya existe factura para orden {}, omitiendo duplicado", ordenId);
            return;
        }
        ordenCompraService.findById(ordenId).ifPresent(orden -> {
            FacturaRequest req = new FacturaRequest();
            req.setFecha(Instant.now());
            req.setTotal(orden.getTotal());
            req.setIdEstado("pagado");
            req.setIdOrden(ordenId);
            save(req);
            log.info("[FACTURA] Factura generada automáticamente para orden {}", ordenId);
        });
    }

    @Transactional(readOnly = true)
    public List<FacturaDTO> findAll() {
        return facturaRepository.findAll().stream().map(FacturaDTO::new).toList();
    }

    @Transactional(readOnly = true)
    public Optional<Factura> findById(UUID id) {
        return facturaRepository.findById(id);
    }

    @Transactional
    public Optional<FacturaDTO> update(UUID id, FacturaRequest dto) {
        return facturaRepository.findById(id).map(factura -> {
            if (dto.getFecha() != null)    factura.setFecha(dto.getFecha());
            if (dto.getTotal() != null)    factura.setTotal(dto.getTotal());
            if (dto.getIdEstado() != null) factura.setIdEstado(dto.getIdEstado());
            if (dto.getIdOrden() != null)
                ordenCompraService.findById(dto.getIdOrden()).ifPresent(factura::setIdOrden);
            return new FacturaDTO(facturaRepository.save(factura));
        });
    }

    @Transactional
    public boolean delete(UUID id) {
        if (!facturaRepository.existsById(id)) return false;
        facturaRepository.deleteById(id);
        return true;
    }

    @Transactional(readOnly = true)
    public Page<FacturaDTO> findAllPaged(int page, int size) {
        return facturaRepository.findAll(PageRequest.of(page, size)).map(FacturaDTO::new);
    }

    @Transactional(readOnly = true)
    public Page<FacturaDTO> findAllByOrderByDateDesc(LocalDateTime pInit, LocalDateTime pEnd, Pageable pageable) {
        return facturaRepository.findAllByOrderByDateDesc(pInit, pEnd, pageable);
    }
}
