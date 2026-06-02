package com.example.B2BProyect.service;

import com.example.B2BProyect.repository.*;
import com.example.B2BProyect.repository.dto.request.EstudianteRequest;
import com.example.B2BProyect.repository.dto.response.EstudianteDTO;
import com.example.B2BProyect.repository.entity.Estudiante;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@AllArgsConstructor
public class EstudianteService {
    private final EstudianteRepository estudianteRepository;
    private final MateriaRepository materiaRepository;

    @Transactional
    public void save(EstudianteRequest estudianteDTO) {
        Estudiante estudiante = new Estudiante();
        estudiante.setNombre(estudianteDTO.getNombre());
        estudiante.setApellido(estudianteDTO.getApellido());
        estudiante.setNota(estudianteDTO.getNota());
        estudiante.setNroTelefono(estudianteDTO.getNroTelefono());
        estudiante.setNroDocumento(estudianteDTO.getNroDocumento());

        materiaRepository.findById(estudianteDTO.getIdMateria().getId())
                .ifPresent(estudiante::setIdMateria);

        this.estudianteRepository.save(estudiante);
    }

    @Transactional(readOnly = true)
    public List<EstudianteDTO> findAll() {
        return estudianteRepository.findAllDTO();
    }

    @Transactional(readOnly = true)
    public Optional<EstudianteDTO> findById(UUID id) {
        return estudianteRepository.findByIdDTO(id);
    }

    @Transactional(readOnly = true)
    public Optional<EstudianteDTO> findByDocumento(String documento) {
        return estudianteRepository.findByDocumentoDTO(documento);
    }

    @Transactional
    public Optional<Estudiante> update(UUID id, EstudianteRequest dto,
                                       MateriaRepository materiaRepository) {
        return estudianteRepository.findById(id).map(estudiante -> {
            if (dto.getNombre() != null) estudiante.setNombre(dto.getNombre());
            if (dto.getApellido() != null) estudiante.setApellido(dto.getApellido());
            if (dto.getIdMateria() != null)
                materiaRepository.findById(dto.getIdMateria().getId())
                        .ifPresent(estudiante::setIdMateria);
            if (dto.getNota() != null) estudiante.setNota(dto.getNota());
            if (dto.getNroTelefono() != null) estudiante.setNroTelefono(dto.getNroTelefono());
            if (dto.getNroDocumento() != null) estudiante.setNroDocumento(dto.getNroDocumento());
            return estudianteRepository.save(estudiante);
        });
    }

}
