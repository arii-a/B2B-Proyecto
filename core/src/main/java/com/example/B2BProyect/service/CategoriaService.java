package com.example.B2BProyect.service;

import com.example.B2BProyect.repository.CategoriaRepository;
import com.example.B2BProyect.repository.dto.request.CategoriaRequest;
import com.example.B2BProyect.repository.dto.response.CategoriaDTO;
import com.example.B2BProyect.repository.entity.Categoria;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@AllArgsConstructor
public class CategoriaService {
    private final CategoriaRepository categoriaRepository;

    @Transactional
    public void save(CategoriaRequest request) {
        Categoria categoria = new Categoria();
        categoria.setNombre(request.getNombre());
        categoria.setDescripcion(request.getDescripcion());
        categoriaRepository.save(categoria);
    }

    @Transactional(readOnly = true)
    public List<CategoriaDTO> findAll() {
        return categoriaRepository.findAll().stream().map(CategoriaDTO::new).toList();
    }

    @Transactional(readOnly = true)
    public Optional<Categoria> findById(UUID id) {
        return categoriaRepository.findById(id);
    }
}
