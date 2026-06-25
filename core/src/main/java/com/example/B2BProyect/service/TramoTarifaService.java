package com.example.B2BProyect.service;

import com.example.B2BProyect.repository.ProductoRepository;
import com.example.B2BProyect.repository.TramoTarifaRepository;
import com.example.B2BProyect.repository.dto.request.TramoTarifaRequest;
import com.example.B2BProyect.repository.dto.response.TramoTarifaDTO;
import com.example.B2BProyect.repository.entity.TramoTarifa;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@AllArgsConstructor
public class TramoTarifaService {
    private final TramoTarifaRepository tramoTarifaRepository;
    private final ContratoEmpresaTarifaService contratoEmpresaTarifaService;
    private final ProductoRepository productoRepository;

    @Transactional
    public TramoTarifaDTO save(TramoTarifaRequest request) {
        TramoTarifa tramo = new TramoTarifa();
        tramo.setTipo(request.getTipo());
        tramo.setCantidadMinima(request.getCantidadMinima());
        tramo.setCantidadMaxima(request.getCantidadMaxima());
        tramo.setPorcentajeDesc(request.getPorcentajeDesc() != null ? request.getPorcentajeDesc() : java.math.BigDecimal.ZERO);
        tramo.setTipoDescuento(request.getTipoDescuento() != null ? request.getTipoDescuento() : "porcentaje");
        tramo.setMontoFijo(request.getMontoFijo());
        if (request.getIdContrato() != null)
            contratoEmpresaTarifaService.findById(request.getIdContrato()).ifPresent(tramo::setIdContrato);
        if (request.getIdProducto() != null)
            productoRepository.findById(request.getIdProducto()).ifPresent(tramo::setIdProducto);
        return new TramoTarifaDTO(tramoTarifaRepository.save(tramo));
    }

    @Transactional(readOnly = true)
    public List<TramoTarifaDTO> findAll() {
        return tramoTarifaRepository.findAll().stream().map(TramoTarifaDTO::new).toList();
    }

    @Transactional(readOnly = true)
    public Optional<TramoTarifa> findById(UUID id) {
        return tramoTarifaRepository.findById(id);
    }

    @Transactional
    public Optional<TramoTarifaDTO> update(UUID id, TramoTarifaRequest dto) {
        return tramoTarifaRepository.findById(id).map(tramo -> {
            if (dto.getTipo() != null)            tramo.setTipo(dto.getTipo());
            if (dto.getCantidadMinima() != null)  tramo.setCantidadMinima(dto.getCantidadMinima());
            if (dto.getCantidadMaxima() != null)  tramo.setCantidadMaxima(dto.getCantidadMaxima());
            if (dto.getPorcentajeDesc() != null)  tramo.setPorcentajeDesc(dto.getPorcentajeDesc());
            if (dto.getTipoDescuento() != null)   tramo.setTipoDescuento(dto.getTipoDescuento());
            tramo.setMontoFijo(dto.getMontoFijo());
            if (dto.getIdContrato() != null)
                contratoEmpresaTarifaService.findById(dto.getIdContrato()).ifPresent(tramo::setIdContrato);
            tramo.setIdProducto(null);
            if (dto.getIdProducto() != null)
                productoRepository.findById(dto.getIdProducto()).ifPresent(tramo::setIdProducto);
            return new TramoTarifaDTO(tramoTarifaRepository.save(tramo));
        });
    }

    @Transactional
    public boolean delete(UUID id) {
        if (!tramoTarifaRepository.existsById(id)) return false;
        tramoTarifaRepository.deleteById(id);
        return true;
    }
}
