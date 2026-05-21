package com.example.B2BProyect.repository;

import com.example.B2BProyect.repository.entity.DetalleOrden;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface DetalleOrdenRepository extends JpaRepository<DetalleOrden, UUID> {
}