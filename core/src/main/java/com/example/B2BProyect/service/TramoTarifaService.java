package com.example.B2BProyect.service;

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
    private final TarifaReglaService tarifaReglaService;

    @Transactional
    public void save(TramoTarifaRequest request) {
        TramoTarifa tramo = new TramoTarifa();
        tramo.setTipo(request.getTipo());
        tramo.setCantidadMinima(request.getCantidadMinima());
        tramo.setCantidadMaxima(request.getCantidadMaxima());
        tramo.setPorcentajeDesc(request.getPorcentajeDesc());
        if (request.getIdRegla() != null) {
            tarifaReglaService.findById(request.getIdRegla()).ifPresent(tramo::setIdRegla);
        }
        tramoTarifaRepository.save(tramo);
    }

    @Transactional(readOnly = true)
    public List<TramoTarifaDTO> findAll() {
        return tramoTarifaRepository.findAll().stream().map(TramoTarifaDTO::new).toList();
    }

    @Transactional(readOnly = true)
    public Optional<TramoTarifa> findById(UUID id) {
        return tramoTarifaRepository.findById(id);
    }
}
