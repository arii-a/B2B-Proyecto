package com.example.B2BProyect.service;

import com.example.B2BProyect.repository.ContratoEmpresaTarifaRepository;
import com.example.B2BProyect.repository.dto.request.ContratoEmpresaTarifaRequest;
import com.example.B2BProyect.repository.dto.response.ContratoEmpresaTarifasDTO;
import com.example.B2BProyect.repository.entity.ContratoEmpresaTarifa;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@AllArgsConstructor
public class ContratoEmpresaTarifaService {
    private final ContratoEmpresaTarifaRepository contratoEmpresaTarifaRepository;
    private final EmpresaService empresaService;
    private final ProveedorService proveedorService;
    private final TarifaReglaService tarifaReglaService;

    @Transactional
    public void save(ContratoEmpresaTarifaRequest request) {
        ContratoEmpresaTarifa contrato = new ContratoEmpresaTarifa();
        contrato.setVigenteDesde(request.getVigenteDesde());
        contrato.setVigenteHasta(request.getVigenteHasta());
        contrato.setActivo(request.getActivo());
        if (request.getIdEmpresa() != null) {
            empresaService.findById(request.getIdEmpresa()).ifPresent(contrato::setIdEmpresa);
        }
        if (request.getIdProveedor() != null) {
            proveedorService.findById(request.getIdProveedor()).ifPresent(contrato::setIdProveedor);
        }
        if (request.getIdRegla() != null) {
            tarifaReglaService.findById(request.getIdRegla()).ifPresent(contrato::setIdRegla);
        }
        contratoEmpresaTarifaRepository.save(contrato);
    }

    @Transactional(readOnly = true)
    public List<ContratoEmpresaTarifasDTO> findAll() {
        return contratoEmpresaTarifaRepository.findAll().stream().map(ContratoEmpresaTarifasDTO::new).toList();
    }

    @Transactional(readOnly = true)
    public Optional<ContratoEmpresaTarifa> findById(UUID id) {
        return contratoEmpresaTarifaRepository.findById(id);
    }
}
