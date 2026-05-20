package com.example.B2BProyect.repository;

import com.example.B2BProyect.repository.entity.Factura;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface FacturaRepository extends JpaRepository<Factura, UUID> {
}