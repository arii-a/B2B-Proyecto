package com.example.B2BProyect.repository;

import com.example.B2BProyect.repository.entity.Proveedor;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface ProveedorRepository extends JpaRepository<Proveedor, UUID> {
}