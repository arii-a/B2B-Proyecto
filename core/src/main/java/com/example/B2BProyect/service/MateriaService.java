package com.example.B2BProyect.service;

import com.example.B2BProyect.repository.EmpresaRepository;
import com.example.B2BProyect.repository.MateriaRepository;
import com.example.B2BProyect.repository.dto.request.EmpresaRequest;
import com.example.B2BProyect.repository.dto.request.EstudianteRequest;
import com.example.B2BProyect.repository.dto.response.EmpresaDTO;
import com.example.B2BProyect.repository.entity.Empresa;
import com.example.B2BProyect.repository.entity.Estudiante;
import com.example.B2BProyect.repository.entity.Materia;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@AllArgsConstructor
public class MateriaService {
    private final MateriaRepository materiaRepository;

    @Transactional
    public void save(Materia materia) {
        materia.setNombre(materia.getNombre());
        materia.setSigla(materia.getSigla());

        this.materiaRepository.save(materia);
    }

    @Transactional(readOnly = true)
    public List<Materia> findAll() {
        return materiaRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Optional<Materia> findById(UUID id) {
        return materiaRepository.findById(id);
    }

    @Transactional(readOnly = true)
    public Optional<Materia> findByName(String nombre) {
        return materiaRepository.findByNombre(nombre);
    }

    @Transactional(readOnly = true)
    public Optional<Materia> findBySigla(String sigla) {
        return materiaRepository.findBySigla(sigla);
    }

    @Transactional
    public Optional<Materia> update(UUID id, Materia dto) {
        return materiaRepository.findById(id).map(materia -> {
            if (dto.getNombre() != null)   materia.setNombre(dto.getNombre());
            if (dto.getSigla() != null)    materia.setSigla(dto.getSigla());

            return materiaRepository.save(materia);
        });
    }
}
