package com.example.B2BProyect.repository;

import com.example.B2BProyect.repository.entity.ContactosEmpresa;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface ContactosEmpresaRepository extends JpaRepository<ContactosEmpresa, UUID> {
}