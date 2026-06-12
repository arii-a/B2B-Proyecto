package com.example.B2BProyect.service;

import com.example.B2BProyect.repository.EmpresaRepository;
import com.example.B2BProyect.repository.dto.request.EmpresaRequest;
import com.example.B2BProyect.repository.dto.response.EmpresaDTO;
import com.example.B2BProyect.repository.entity.Empresa;
import com.example.B2BProyect.service.exception.NotDataFoundException;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@Slf4j
@AllArgsConstructor
public class EmpresaService {
    private final EmpresaRepository empresaRepository;
    private final LogService logService;

    @Transactional(noRollbackFor = NotDataFoundException.class)
    public EmpresaDTO save(EmpresaRequest empresaDTO) {
        Empresa empresa = new Empresa();
        empresa.setNombre(empresaDTO.getNombre());
        empresa.setDominio(empresaDTO.getDominio());
        empresa.setActivo(true);
        empresa.setNit(empresaDTO.getNit());
        empresa.setRazonSocial(empresaDTO.getRazonSocial());

        logService.info("Creando empresa nueva. Vamos!");

        return new EmpresaDTO(this.empresaRepository.save(empresa));
    }

    @Transactional(readOnly = true)
    public List<EmpresaDTO> findAll() {
        return empresaRepository.findAllDTO();
    }

    @Transactional(readOnly = true)
    public Optional<Empresa> findById(UUID id) {
        return empresaRepository.findById(id);
    }

    @Transactional(readOnly = true)
    public Optional<EmpresaDTO> findByIdDTO(UUID id) {
        return empresaRepository.findByIdDTO(id);
    }

    @Transactional(readOnly = true)
    public Optional<EmpresaDTO> findByName(String nombre) {
        return empresaRepository.findByNameDTO(nombre);
    }

    @Transactional
    public Optional<EmpresaDTO> update(UUID id, EmpresaRequest dto) {
        return empresaRepository.findById(id).map(empresa -> {
            if (dto.getNombre() != null)      empresa.setNombre(dto.getNombre());
            if (dto.getDominio() != null)     empresa.setDominio(dto.getDominio());
            if (dto.getNit() != null)         empresa.setNit(dto.getNit());
            if (dto.getRazonSocial() != null) empresa.setRazonSocial(dto.getRazonSocial());
            return new EmpresaDTO(empresaRepository.save(empresa));
        });
    }

    @Transactional
    public boolean delete(UUID id) {
        if (!empresaRepository.existsById(id)) return false;
        empresaRepository.deleteById(id);
        return true;
    }

    @Scheduled(cron = "0 */1 * * * *")
    public void listarEmpresas() {
        List<EmpresaDTO> empresas = empresaRepository.findAllDTO();
        log.info("Listando empresas: {}", empresas);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    @Async
    public void modificarEmpresa(UUID id, EmpresaRequest dto) {
        Empresa empresa = empresaRepository.findById(id).orElseThrow(()
                -> new NullPointerException("No existe la empresa"));

        if (dto.getNombre() != null) empresa.setNombre(dto.getNombre());
        if (dto.getDominio() != null) empresa.setDominio(dto.getDominio());
        if (dto.getNit() != null) empresa.setNit(dto.getNit());
        if (dto.getRazonSocial() != null) empresa.setRazonSocial(dto.getRazonSocial());

        empresaRepository.save(empresa);
    }


}
