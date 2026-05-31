package com.example.B2BProyect.service;

import com.example.B2BProyect.repository.FacturaRepository;
import com.example.B2BProyect.repository.dto.request.FacturaRequest;
import com.example.B2BProyect.repository.dto.response.FacturaDTO;
import com.example.B2BProyect.repository.entity.Factura;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@AllArgsConstructor
public class FacturaService {
    private final FacturaRepository facturaRepository;
    private final OrdenCompraService ordenCompraService;

    @Transactional
    public void save(FacturaRequest request) {
        Factura factura = new Factura();
        factura.setFecha(request.getFecha());
        factura.setTotal(request.getTotal());
        factura.setIdEstado(request.getIdEstado());
        if (request.getIdOrden() != null) {
            ordenCompraService.findById(request.getIdOrden()).ifPresent(factura::setIdOrden);
        }
        facturaRepository.save(factura);
    }

    @Transactional(readOnly = true)
    public List<FacturaDTO> findAll() {
        return facturaRepository.findAll().stream().map(FacturaDTO::new).toList();
    }

    @Transactional(readOnly = true)
    public Optional<Factura> findById(UUID id) {
        return facturaRepository.findById(id);
    }
}
