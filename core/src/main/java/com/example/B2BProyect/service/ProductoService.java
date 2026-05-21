package com.example.B2BProyect.service;

import com.example.B2BProyect.repository.CategoriaRepository;
import com.example.B2BProyect.repository.ProductoRepository;
import com.example.B2BProyect.repository.entity.Categoria;
import com.example.B2BProyect.repository.entity.Empresa;
import com.example.B2BProyect.repository.entity.Producto;
import com.example.B2BProyect.repository.entity.Proveedor;
import org.springframework.transaction.annotation.Transactional;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@AllArgsConstructor // importa todos los constructoes
@Service
public class ProductoService {
    private final ProductoRepository productoRepository;
    private final CategoriaService categoriaService;
    private final ProveedorService proveedorService;

    @Transactional //(propagation = Propagation.REQUIRES_NEW) genera su propia transacción si es llamado por otro método transaccional
    // pero por defecto todo método de service YA es transaccional por defecto
    public void save(UUID categoriaId, UUID proveedorId, Producto producto) {
        Optional<Categoria> optionalCategoria = this.categoriaService.findById(categoriaId);
        Optional<Proveedor> optionalProveedor = this.proveedorService.findById(proveedorId);
        Categoria categoria = null;
        Proveedor proveedor = null;
        if(optionalCategoria.isPresent()) {
            categoria = optionalCategoria.get();
        }
        if(optionalProveedor.isPresent()) {
            proveedor = optionalProveedor.get();
        }
        producto.setIdCategoria(categoria);
        producto.setIdProveedor(proveedor);
        productoRepository.save(producto);
    }

    @Transactional(readOnly = true)
    public List<Producto> findAll() {
        return productoRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Optional<Producto> findById(UUID id) {
        return productoRepository.findById(id);
    }


}
