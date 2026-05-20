package com.example.B2BProyect.service;

import com.example.B2BProyect.repository.RolUsuarioRepository;
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
    public void save(RolUsuario rolUsuario) {
        rolUsuarioRepository.save(rolUsuario);
    }

    @Transactional(readOnly = true)
    public List<RolUsuario> findAll() {
        return rolUsuarioRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Optional<RolUsuario> findById(UUID id) {
        return rolUsuarioRepository.findById(id);
    }
}
