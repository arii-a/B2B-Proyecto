package com.example.B2BProyect.repository;

import com.example.B2BProyect.repository.entity.ProductoAlmacen;
import com.example.B2BProyect.repository.entity.ProductoAlmacenId;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProductoAlmacenRepository extends JpaRepository<ProductoAlmacen, ProductoAlmacenId> {
}