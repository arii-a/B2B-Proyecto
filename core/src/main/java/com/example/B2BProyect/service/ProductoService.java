package com.example.B2BProyect.service;

import com.example.B2BProyect.repository.ProductoRepository;
import com.example.B2BProyect.repository.dto.request.ProductoRequest;
import com.example.B2BProyect.repository.dto.response.ProductoDTO;
import com.example.B2BProyect.repository.entity.Producto;
import lombok.AllArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
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
        if (request.getIdCategoria() != null)
            categoriaService.findById(request.getIdCategoria()).ifPresent(producto::setIdCategoria);
        if (request.getIdProveedor() != null)
            proveedorService.findById(request.getIdProveedor()).ifPresent(producto::setIdProveedor);
        productoRepository.save(producto);
    }

    @Transactional(readOnly = true)
    public List<ProductoDTO> findAll() {
        return productoRepository.findAll().stream().map(ProductoDTO::new).toList();
    }

    @Transactional(readOnly = true)
    public Page<ProductoDTO> findAllPaged(int page, int size) {
        return productoRepository.findAllPaged(PageRequest.of(page, size));
    }

    @Transactional(readOnly = true)
    public Optional<Producto> findById(UUID id) {
        return productoRepository.findById(id);
    }

    @Transactional
    public Optional<ProductoDTO> update(UUID id, ProductoRequest dto) {
        return productoRepository.findById(id).map(producto -> {
            if (dto.getSku() != null)          producto.setSku(dto.getSku());
            if (dto.getNombre() != null)       producto.setNombre(dto.getNombre());
            if (dto.getDescripcion() != null)  producto.setDescripcion(dto.getDescripcion());
            if (dto.getUnidadMedida() != null) producto.setUnidadMedida(dto.getUnidadMedida());
            if (dto.getActivo() != null)       producto.setActivo(dto.getActivo());
            if (dto.getIdCategoria() != null)
                categoriaService.findById(dto.getIdCategoria()).ifPresent(producto::setIdCategoria);
            if (dto.getIdProveedor() != null)
                proveedorService.findById(dto.getIdProveedor()).ifPresent(producto::setIdProveedor);
            return new ProductoDTO(productoRepository.save(producto));
        });
    }

    @Transactional(readOnly = true)
    public List<ProductoDTO> findByProveedor(UUID idProveedor) {
        return productoRepository.findByIdProveedorId(idProveedor)
                .stream().map(ProductoDTO::new).toList();
    }

    @Transactional
    public boolean delete(UUID id) {
        if (!productoRepository.existsById(id)) return false;
        productoRepository.deleteById(id);
        return true;
    }
}
