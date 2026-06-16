package com.example.B2BProyect.service;

import com.example.B2BProyect.repository.EmpresaRepository;
import com.example.B2BProyect.repository.dto.request.EmpresaRequest;
import com.example.B2BProyect.repository.dto.response.EmpresaDTO;
import com.example.B2BProyect.repository.entity.Empresa;
import com.example.B2BProyect.service.exception.EmpresasException;
import com.example.B2BProyect.service.exception.NotDataFoundException;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.RequestParam;

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
        return new EmpresaDTO(this.empresaRepository.save(empresa));
    }

    @Transactional(readOnly = true)
    public Page<EmpresaDTO> findAll(Integer page, Integer size, String sortBy) {
        return empresaRepository.findAllDTO(PageRequest.of(page, size, Sort.by(sortBy)));
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

//    @Scheduled(cron = "0 */1 * * * *")
//    public void listarEmpresas(Pageable page) {
//        Page<EmpresaDTO> empresas = empresaRepository.findAllDTO(page);
//        log.info("Listando empresas: {}", empresas);
//    }
}
