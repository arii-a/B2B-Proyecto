package com.example.B2BProyect.repository;

import com.example.B2BProyect.repository.entity.Comision;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface ComisionRepository extends JpaRepository<Comision, UUID> {
}