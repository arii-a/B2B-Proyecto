package com.example.B2BProyect.service;

import com.example.B2BProyect.repository.ProductoRepository;
import com.example.B2BProyect.repository.dto.request.ProductoRequest;
import com.example.B2BProyect.repository.dto.response.ProductoDTO;
import com.example.B2BProyect.repository.entity.Producto;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@AllArgsConstructor
@Service
public class ProductoService {
    private final ProductoRepository productoRepository;
    private final CategoriaService categoriaService;
    private final ProveedorService proveedorService;

    @Transactional
    public void save(ProductoRequest request) {
        Producto producto = new Producto();
        producto.setSku(request.getSku());
        producto.setNombre(request.getNombre());
        producto.setDescripcion(request.getDescripcion());
        producto.setUnidadMedida(request.getUnidadMedida());
        producto.setActivo(request.getActivo());
        if (request.getIdCategoria() != null) {
            categoriaService.findById(request.getIdCategoria()).ifPresent(producto::setIdCategoria);
        }
        if (request.getIdProveedor() != null) {
            proveedorService.findById(request.getIdProveedor()).ifPresent(producto::setIdProveedor);
        }
        productoRepository.save(producto);
    }

    @Transactional(readOnly = true)
    public List<ProductoDTO> findAll() {
        return productoRepository.findAll().stream().map(ProductoDTO::new).toList();
    }

    @Transactional(readOnly = true)
    public Optional<Producto> findById(UUID id) {
        return productoRepository.findById(id);
    }
}
