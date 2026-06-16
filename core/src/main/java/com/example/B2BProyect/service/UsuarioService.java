package com.example.B2BProyect.service;

import com.example.B2BProyect.repository.EmpresaRepository;
import com.example.B2BProyect.repository.RolUsuarioRepository;
import com.example.B2BProyect.repository.SucursalEmpresaRepository;
import com.example.B2BProyect.repository.UsuarioRepository;
import com.example.B2BProyect.repository.dto.request.UsuarioRequest;
import com.example.B2BProyect.repository.dto.response.EmpresaDTO;
import com.example.B2BProyect.repository.dto.response.SucursalEmpresaDTO;
import com.example.B2BProyect.repository.dto.response.UsuarioDTO;
import com.example.B2BProyect.repository.entity.Log;
import com.example.B2BProyect.repository.entity.Usuario;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@AllArgsConstructor
@Slf4j
public class UsuarioService {
    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public void save(UsuarioRequest dto,
                     EmpresaRepository empresaRepository,
                     SucursalEmpresaRepository sucursalRepository,
                     RolUsuarioRepository rolRepository) {
        Usuario usuario = new Usuario();
        usuario.setNombre(dto.getNombre());
        usuario.setEmail(dto.getEmail());
        usuario.setPasswordHash(passwordEncoder.encode(
                dto.getPassword() != null ? dto.getPassword() : "changeme"));
        if (dto.getActivo() != null) usuario.setActivo(dto.getActivo());
        if (dto.getIdEmpresa() != null)
            empresaRepository.findById(dto.getIdEmpresa()).ifPresent(usuario::setIdEmpresa);
        if (dto.getIdSucursal() != null)
            sucursalRepository.findById(dto.getIdSucursal()).ifPresent(usuario::setIdSucursal);
        if (dto.getIdRol() != null)
            rolRepository.findById(dto.getIdRol()).ifPresent(usuario::setIdRol);
        usuarioRepository.save(usuario);
    }

    @Transactional(readOnly = true)
    public List<UsuarioDTO> findAll() {
        return usuarioRepository.findAll().stream()
                .map(u -> {
                    UsuarioDTO dto = new UsuarioDTO(u);
                    if (u.getIdEmpresa() != null)
                        dto.setIdEmpresa(new EmpresaDTO(u.getIdEmpresa()));
                    if (u.getIdSucursal() != null)
                        dto.setIdSucursal(new SucursalEmpresaDTO(u.getIdSucursal()));
                    return dto;
                })
                .toList();
    }

    @Transactional(readOnly = true)
    public Optional<Usuario> findById(UUID id) {
        return usuarioRepository.findById(id);
    }

    @Transactional(readOnly = true)
    public Optional<Usuario> findByEmailToValidateSession(String email) {
        return this.usuarioRepository.findByUserEmailToValidateSession(email);
    }

    @Transactional
    public Optional<UsuarioDTO> update(UUID id, UsuarioRequest dto,
                                       EmpresaRepository empresaRepository,
                                       SucursalEmpresaRepository sucursalRepository,
                                       RolUsuarioRepository rolRepository) {
        return usuarioRepository.findById(id).map(usuario -> {
            if (dto.getNombre() != null)   usuario.setNombre(dto.getNombre());
            if (dto.getEmail() != null)    usuario.setEmail(dto.getEmail());
            if (dto.getActivo() != null)   usuario.setActivo(dto.getActivo());
            if (dto.getIdEmpresa() != null)
                empresaRepository.findById(dto.getIdEmpresa()).ifPresent(usuario::setIdEmpresa);
            if (dto.getIdSucursal() != null)
                sucursalRepository.findById(dto.getIdSucursal()).ifPresent(usuario::setIdSucursal);
            if (dto.getIdRol() != null)
                rolRepository.findById(dto.getIdRol()).ifPresent(usuario::setIdRol);
            return new UsuarioDTO(usuarioRepository.save(usuario));
        });
    }

    @Transactional(readOnly = true)
    public Page<UsuarioDTO> findAllByOrderByDateDesc(LocalDateTime pInit, LocalDateTime pEnd, Pageable pageable) {
        return usuarioRepository.findAllByOrderByDateDesc(pInit, pEnd, pageable);
    }
}
