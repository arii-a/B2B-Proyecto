package com.example.B2BProyect.service;

import com.example.B2BProyect.repository.DetalleFacturaRepository;
import com.example.B2BProyect.repository.DetalleOrdenRepository;
import com.example.B2BProyect.repository.FacturaRepository;
import com.example.B2BProyect.repository.UsuarioRepository;
import com.example.B2BProyect.repository.dto.request.FacturaRequest;
import com.example.B2BProyect.repository.dto.response.FacturaDTO;
import com.example.B2BProyect.repository.entity.DetalleFactura;
import com.example.B2BProyect.repository.entity.DetalleOrden;
import com.example.B2BProyect.repository.entity.Empresa;
import com.example.B2BProyect.repository.entity.Factura;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
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
    private final DetalleOrdenRepository detalleOrdenRepository;
    private final DetalleFacturaRepository detalleFacturaRepository;
    private final PdfGeneratorService pdfGeneratorService;

    @Transactional
    public void save(FacturaRequest request) {
        Factura factura = new Factura();
        factura.setFecha(request.getFecha());
        factura.setTotal(request.getTotal());
        factura.setIdEstado(request.getIdEstado());
        if (request.getIdOrden() != null)
            ordenCompraService.findById(request.getIdOrden()).ifPresent(factura::setIdOrden);
        facturaRepository.save(factura);
    }

    @Transactional
    public void saveFromPayment(UUID ordenId) {
        if (facturaRepository.existsByIdOrdenId(ordenId)) {
            log.info("[FACTURA] Ya existe factura para orden {}, omitiendo duplicado", ordenId);
            return;
        }

        ordenCompraService.findById(ordenId).ifPresent(orden -> {
            Factura factura = new Factura();
            factura.setFecha(Instant.now());
            factura.setTotal(orden.getTotal());
            factura.setIdEstado("pagado");
            factura.setIdOrden(orden);
            Factura saved = facturaRepository.save(factura);

            // Copiar DetalleOrden → DetalleFactura
            List<DetalleOrden> detalles = detalleOrdenRepository.findByOrden(ordenId);
            List<FacturaEmailData.Item> emailItems = new ArrayList<>();

            for (DetalleOrden det : detalles) {
                DetalleFactura df = new DetalleFactura();
                df.setIdFactura(saved);
                df.setIdProducto(det.getIdProducto());
                df.setCantidad(det.getCantidad());
                BigDecimal precio = det.getPrecioUnitario() != null ? det.getPrecioUnitario() : BigDecimal.ZERO;
                BigDecimal subtotal = det.getSubtotal() != null ? det.getSubtotal() : precio.multiply(BigDecimal.valueOf(det.getCantidad()));
                df.setPrecioUnitario(precio);
                df.setSubtotal(subtotal);
                detalleFacturaRepository.save(df);

                emailItems.add(new FacturaEmailData.Item(
                        det.getIdProducto().getNombre(),
                        det.getCantidad(),
                        precio,
                        subtotal
                ));
            }

            log.info("[FACTURA] Factura {} generada para orden {} con {} items", saved.getId(), ordenId, detalles.size());

            // Cargar datos eagerly antes de salir de la transacción
            String fecha = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")
                    .withZone(ZoneId.of("America/La_Paz"))
                    .format(saved.getFecha());

            String compradoraNombre = orden.getIdEmpresaCompradora() != null ? orden.getIdEmpresaCompradora().getNombre() : "—";
            String compradoraNit    = orden.getIdEmpresaCompradora() != null ? orden.getIdEmpresaCompradora().getNit()    : "—";
            String proveedorNombre  = orden.getIdProveedor() != null && orden.getIdProveedor().getIdEmpresa() != null
                    ? orden.getIdProveedor().getIdEmpresa().getNombre() : "—";
            String proveedorNit     = orden.getIdProveedor() != null && orden.getIdProveedor().getIdEmpresa() != null
                    ? orden.getIdProveedor().getIdEmpresa().getNit() : "—";

            FacturaEmailData emailData = new FacturaEmailData(
                    saved.getId(), ordenId, fecha, "PAGADO",
                    compradoraNombre, compradoraNit,
                    proveedorNombre, proveedorNit,
                    orden.getTotal(), emailItems
            );

            // Enviar emails a empresa compradora y proveedor
            try {
                if (orden.getIdEmpresaCompradora() != null) {
                    UUID empId = orden.getIdEmpresaCompradora().getId();
                    List<com.example.B2BProyect.repository.entity.Usuario> usCom = usuarioRepository.findByIdEmpresaId(empId);
                    log.info("[FACTURA] Usuarios compradora (empresaId={}): {}", empId, usCom.stream().map(u -> u.getEmail()).toList());
                    usCom.stream().findFirst().ifPresent(u -> emailService.sendFacturaConPdf(u.getEmail(), emailData));
                }
            } catch (Exception e) {
                log.warn("[FACTURA] No se pudo enviar email a compradora: {}", e.getMessage());
            }

            try {
                if (orden.getIdProveedor() != null) {
                    UUID provId = orden.getIdProveedor().getId();
                    Empresa empProv = orden.getIdProveedor().getIdEmpresa();
                    log.info("[FACTURA] Proveedor id={}, empresa={}", provId, empProv != null ? empProv.getId() : "NULL");
                    if (empProv != null) {
                        List<com.example.B2BProyect.repository.entity.Usuario> usProv = usuarioRepository.findByIdEmpresaId(empProv.getId());
                        log.info("[FACTURA] Usuarios proveedor (empresaId={}): {}", empProv.getId(), usProv.stream().map(u -> u.getEmail()).toList());
                        usProv.stream().findFirst().ifPresent(u -> emailService.sendFacturaConPdf(u.getEmail(), emailData));
                    }
                } else {
                    log.warn("[FACTURA] orden.getIdProveedor() es NULL para orden {}", ordenId);
                }
            } catch (Exception e) {
                log.warn("[FACTURA] No se pudo enviar email a proveedor: {}", e.getMessage(), e);
            }
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

    @Transactional(readOnly = true)
    public byte[] generatePdf(UUID facturaId) {
        return facturaRepository.findById(facturaId).map(factura -> {
            String fecha = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")
                    .withZone(ZoneId.of("America/La_Paz"))
                    .format(factura.getFecha());

            var orden = factura.getIdOrden();
            String compradoraNombre = orden.getIdEmpresaCompradora() != null ? orden.getIdEmpresaCompradora().getNombre() : "—";
            String compradoraNit    = orden.getIdEmpresaCompradora() != null ? orden.getIdEmpresaCompradora().getNit()    : "—";
            String proveedorNombre  = orden.getIdProveedor() != null && orden.getIdProveedor().getIdEmpresa() != null
                    ? orden.getIdProveedor().getIdEmpresa().getNombre() : "—";
            String proveedorNit     = orden.getIdProveedor() != null && orden.getIdProveedor().getIdEmpresa() != null
                    ? orden.getIdProveedor().getIdEmpresa().getNit() : "—";

            List<FacturaEmailData.Item> items = detalleFacturaRepository.findByFacturaDTO(facturaId)
                    .stream()
                    .map(df -> new FacturaEmailData.Item(
                            df.getNombreProducto(),
                            df.getCantidad(),
                            df.getPrecioUnitario(),
                            df.getSubtotal()))
                    .toList();

            FacturaEmailData data = new FacturaEmailData(
                    factura.getId(), orden.getId(), fecha, factura.getIdEstado().toUpperCase(),
                    compradoraNombre, compradoraNit, proveedorNombre, proveedorNit,
                    factura.getTotal(), items);

            return pdfGeneratorService.generateFacturaPdf(data);
        }).orElse(new byte[0]);
    }
}
