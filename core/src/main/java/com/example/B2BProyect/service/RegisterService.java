package com.example.B2BProyect.service;

import com.example.B2BProyect.repository.EmpresaRepository;
import com.example.B2BProyect.repository.RolUsuarioRepository;
import com.example.B2BProyect.repository.SucursalEmpresaRepository;
import com.example.B2BProyect.repository.UsuarioRepository;
import com.example.B2BProyect.repository.dto.request.RegisterRequest;
import com.example.B2BProyect.repository.entity.Empresa;
import com.example.B2BProyect.repository.entity.RolUsuario;
import com.example.B2BProyect.repository.entity.SucursalEmpresa;
import com.example.B2BProyect.repository.entity.Usuario;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@AllArgsConstructor
public class RegisterService {

    private final EmpresaRepository empresaRepository;
    private final SucursalEmpresaRepository sucursalRepository;
    private final UsuarioRepository usuarioRepository;
    private final RolUsuarioRepository rolUsuarioRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public Usuario register(RegisterRequest req) {
        // 1. Empresa
        Empresa empresa = new Empresa();
        empresa.setNombre(req.getEmpresa().getNombre());
        empresa.setRazonSocial(req.getEmpresa().getRazonSocial());
        empresa.setNit(req.getEmpresa().getNit());
        empresa.setDominio(req.getEmpresa().getDominio());
        empresa.setLogoUrl(req.getEmpresa().getLogoUrl());
        empresa.setActivo(true);
        empresa = empresaRepository.save(empresa);

        // 2. Sucursal
        SucursalEmpresa sucursal = new SucursalEmpresa();
        sucursal.setNombre(req.getSucursal().getNombre());
        sucursal.setDireccion(req.getSucursal().getDireccion());
        sucursal.setActivo(true);
        sucursal.setIdEmpresa(empresa);
        sucursal = sucursalRepository.save(sucursal);

        // 3. Rol empresa
        RolUsuario rolEmpresa = rolUsuarioRepository.findAll().stream()
                .filter(r -> r.getNombre().equals("empresa"))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Rol 'empresa' no encontrado. Ejecuta el backend con la DB vacía para que se cree."));

        // 4. Usuario
        Usuario usuario = new Usuario();
        usuario.setNombre(req.getUsuario().getNombre());
        usuario.setEmail(req.getUsuario().getEmail());
        usuario.setPasswordHash(passwordEncoder.encode(req.getUsuario().getPassword()));
        usuario.setActivo(true);
        usuario.setIdEmpresa(empresa);
        usuario.setIdSucursal(sucursal);
        usuario.setIdRol(rolEmpresa);
        usuario = usuarioRepository.save(usuario);

        log.info("Empresa registrada: {} | Usuario: {}", empresa.getNombre(), usuario.getEmail());
        return usuario;
    }
}
