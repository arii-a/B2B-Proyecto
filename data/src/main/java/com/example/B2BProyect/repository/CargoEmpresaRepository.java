package com.example.B2BProyect.repository;

import com.example.B2BProyect.repository.entity.CargoEmpresa;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface CargoEmpresaRepository extends JpaRepository<CargoEmpresa, UUID> {
}