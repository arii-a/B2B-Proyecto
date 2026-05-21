package com.example.B2BProyect.repository;

import com.example.B2BProyect.repository.entity.CatProveedor;
import com.example.B2BProyect.repository.entity.CatProveedorId;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CatProveedorRepository extends JpaRepository<CatProveedor, CatProveedorId> {
}