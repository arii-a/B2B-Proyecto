package com.example.B2BProyect.service;

import com.example.B2BProyect.repository.CatProveedorRepository;
import com.example.B2BProyect.repository.dto.request.CatProveedorRequest;
import com.example.B2BProyect.repository.dto.response.CatProveedorDTO;
import com.example.B2BProyect.repository.entity.CatProveedor;
import com.example.B2BProyect.repository.entity.CatProveedorId;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@AllArgsConstructor
public class CatProveedorService {
    private final CatProveedorRepository catProveedorRepository;
    private final CategoriaService categoriaService;
    private final ProveedorService proveedorService;

    @Transactional
    public void save(CatProveedorRequest request) {
        CatProveedor catProveedor = new CatProveedor();
        CatProveedorId id = new CatProveedorId();
        id.setIdCategoria(request.getIdCategoria());
        id.setIdProveedor(request.getIdProveedor());
        catProveedor.setId(id);
        categoriaService.findById(request.getIdCategoria()).ifPresent(catProveedor::setIdCategoria);
        proveedorService.findById(request.getIdProveedor()).ifPresent(catProveedor::setIdProveedor);
        catProveedorRepository.save(catProveedor);
    }

    @Transactional(readOnly = true)
    public List<CatProveedorDTO> findAll() {
        return catProveedorRepository.findAll().stream().map(CatProveedorDTO::new).toList();
    }

    @Transactional(readOnly = true)
    public Optional<CatProveedor> findById(CatProveedorId id) {
        return catProveedorRepository.findById(id);
    }
}
