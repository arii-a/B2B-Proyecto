package com.example.B2BProyect.service;

import com.example.B2BProyect.repository.ProveedorRepository;
import com.example.B2BProyect.repository.UsuarioRepository;
import com.example.B2BProyect.repository.dto.request.ProveedorRequest;
import com.example.B2BProyect.repository.dto.response.ProveedorDTO;
import com.example.B2BProyect.repository.entity.Proveedor;
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
public class ProveedorService {
    private final ProveedorRepository proveedorRepository;
    private final EmpresaService empresaService;
    private final UsuarioRepository usuarioRepository;
    private final EmailService emailService;

    @Transactional
    public void save(UUID empresaId, ProveedorRequest request) {
        Proveedor proveedor = new Proveedor();
        proveedor.setActivo(request.getActivo());
        empresaService.findById(empresaId).ifPresent(proveedor::setIdEmpresa);
        if (request.getUrlMatricula() != null) proveedor.setUrlMatricula(request.getUrlMatricula());
        if (request.getUrlCiFrontal() != null) proveedor.setUrlCiFrontal(request.getUrlCiFrontal());
        if (request.getUrlCiReverso() != null) proveedor.setUrlCiReverso(request.getUrlCiReverso());
        proveedorRepository.save(proveedor);
        try {
            String empresaNombre = proveedor.getIdEmpresa() != null ? proveedor.getIdEmpresa().getNombre() : "Desconocida";
            String empresaLogoUrl = proveedor.getIdEmpresa() != null ? proveedor.getIdEmpresa().getLogoUrl() : null;
            String empresaNit     = proveedor.getIdEmpresa() != null ? proveedor.getIdEmpresa().getNit()     : null;
            var admins = usuarioRepository.findByIdRolNombre("admin");
            log.info("[PROVEEDOR] Solicitud de '{}' — notificando a {} admin(s)", empresaNombre, admins.size());
            admins.forEach(admin -> {
                log.info("[PROVEEDOR] Enviando email a admin: {}", admin.getEmail());
                emailService.sendSolicitudProveedor(admin.getEmail(), empresaNombre, empresaLogoUrl, empresaNit);
            });
        } catch (Exception e) {
            log.warn("No se pudo notificar a los admins de la solicitud de proveedor: {}", e.getMessage());
        }
    }

    @Transactional(readOnly = true)
    public List<ProveedorDTO> findAll() {
        return proveedorRepository.findAll().stream().map(ProveedorDTO::new).toList();
    }

    @Transactional(readOnly = true)
    public Optional<Proveedor> findById(UUID id) {
        return proveedorRepository.findById(id);
    }

    @Transactional(readOnly = true)
    public Optional<ProveedorDTO> findByIdDTO(UUID id) {
        return proveedorRepository.findByIdDTO(id);
    }

    @Transactional
    public Optional<ProveedorDTO> update(UUID id, ProveedorRequest dto) {
        return proveedorRepository.findById(id).map(proveedor -> {
            if (dto.getActivo() != null) proveedor.setActivo(dto.getActivo());
            return new ProveedorDTO(proveedorRepository.save(proveedor));
        });
    }

    @Transactional
    public boolean delete(UUID id) {
        if (!proveedorRepository.existsById(id)) return false;
        proveedorRepository.deleteById(id);
        return true;
    }
}
