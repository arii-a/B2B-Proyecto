package com.example.B2BProyect.service;

import com.example.B2BProyect.repository.ProductoAlmacenRepository;
import com.example.B2BProyect.repository.dto.request.ProductoAlmacenRequest;
import com.example.B2BProyect.repository.dto.response.ProductoAlmacenDTO;
import com.example.B2BProyect.repository.entity.ProductoAlmacen;
import com.example.B2BProyect.repository.entity.ProductoAlmacenId;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@AllArgsConstructor
public class ProductoAlmacenService {
    private final ProductoAlmacenRepository productoAlmacenRepository;
    private final AlmacenService almacenService;
    private final ProductoService productoService;

    @Transactional
    public void save(ProductoAlmacenRequest request) {
        ProductoAlmacen productoAlmacen = new ProductoAlmacen();
        ProductoAlmacenId id = new ProductoAlmacenId();
        id.setIdAlmacen(request.getIdAlmacen());
        id.setIdProducto(request.getIdProducto());
        productoAlmacen.setId(id);
        productoAlmacen.setStock(request.getStock());
        productoAlmacen.setMax(request.getMax());
        productoAlmacen.setMin(request.getMin());
        productoAlmacen.setActivo(request.getActivo());
        almacenService.findById(request.getIdAlmacen()).ifPresent(productoAlmacen::setAlmacen);
        productoService.findById(request.getIdProducto()).ifPresent(productoAlmacen::setProducto);
        productoAlmacenRepository.save(productoAlmacen);
    }

    @Transactional(readOnly = true)
    public List<ProductoAlmacenDTO> findAll() {
        return productoAlmacenRepository.findAll().stream().map(ProductoAlmacenDTO::new).toList();
    }

    @Transactional(readOnly = true)
    public Optional<ProductoAlmacen> findById(ProductoAlmacenId id) {
        return productoAlmacenRepository.findById(id);
    }

    @Transactional
    public Optional<ProductoAlmacenDTO> update(ProductoAlmacenId id, ProductoAlmacenRequest dto) {
        return productoAlmacenRepository.findById(id).map(pa -> {
            if (dto.getStock() != null)  pa.setStock(dto.getStock());
            if (dto.getMax() != null)    pa.setMax(dto.getMax());
            if (dto.getMin() != null)    pa.setMin(dto.getMin());
            if (dto.getActivo() != null) pa.setActivo(dto.getActivo());
            return new ProductoAlmacenDTO(productoAlmacenRepository.save(pa));
        });
    }

    @Transactional
    public boolean delete(ProductoAlmacenId id) {
        if (!productoAlmacenRepository.existsById(id)) return false;
        productoAlmacenRepository.deleteById(id);
        return true;
    }
}
