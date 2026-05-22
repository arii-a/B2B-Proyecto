package com.example.B2BProyect.repository;

import com.example.B2BProyect.repository.entity.RolUsuario;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface RolUsuarioRepository extends JpaRepository<RolUsuario, UUID> {
}