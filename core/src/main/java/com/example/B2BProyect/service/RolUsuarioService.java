package com.example.B2BProyect.service;

import com.example.B2BProyect.repository.RolUsuarioRepository;
import com.example.B2BProyect.repository.dto.request.RolUsuarioRequest;
import com.example.B2BProyect.repository.dto.response.RolUsuarioDTO;
import com.example.B2BProyect.repository.entity.RolUsuario;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@AllArgsConstructor
public class RolUsuarioService {
    private final RolUsuarioRepository rolUsuarioRepository;

    @Transactional
    public void save(RolUsuarioRequest request) {
        RolUsuario rolUsuario = new RolUsuario();
        rolUsuario.setNombre(request.getNombre());
        rolUsuario.setDescripcion(request.getDescripcion());
        rolUsuarioRepository.save(rolUsuario);
    }

    @Transactional(readOnly = true)
    public List<RolUsuarioDTO> findAll() {
        return rolUsuarioRepository.findAll().stream().map(RolUsuarioDTO::new).toList();
    }

    @Transactional(readOnly = true)
    public Optional<RolUsuario> findById(UUID id) {
        return rolUsuarioRepository.findById(id);
    }
}
