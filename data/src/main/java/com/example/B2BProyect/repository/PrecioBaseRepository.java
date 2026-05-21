package com.example.B2BProyect.repository;

import com.example.B2BProyect.repository.entity.PrecioBase;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface PrecioBaseRepository extends JpaRepository<PrecioBase, UUID> {
}