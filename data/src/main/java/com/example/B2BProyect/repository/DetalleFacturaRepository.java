package com.example.B2BProyect.repository;

import com.example.B2BProyect.repository.entity.DetalleFactura;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface DetalleFacturaRepository extends JpaRepository<DetalleFactura, UUID> {
}