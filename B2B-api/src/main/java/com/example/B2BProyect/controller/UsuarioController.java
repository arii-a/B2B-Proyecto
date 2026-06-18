package com.example.B2BProyect.controller;

import com.example.B2BProyect.service.exception.OperationException;
import com.example.B2BProyect.repository.EmpresaRepository;
import com.example.B2BProyect.repository.RolUsuarioRepository;
import com.example.B2BProyect.repository.SucursalEmpresaRepository;
import com.example.B2BProyect.repository.dto.request.UsuarioRequest;
import com.example.B2BProyect.repository.dto.response.UsuarioDTO;
import com.example.B2BProyect.service.EmailService;
import com.example.B2BProyect.service.UsuarioService;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Date;
import java.util.List;
import java.util.Random;
import java.util.UUID;

@Slf4j
@AllArgsConstructor
@Controller
@RequestMapping("/api/v1/usuarios")
public class UsuarioController {
    private final UsuarioService usuarioService;
    private final EmailService emailService;
    private final EmpresaRepository empresaRepository;
    private final SucursalEmpresaRepository sucursalRepository;
    private final RolUsuarioRepository rolRepository;

    /*@GetMapping
    public ResponseEntity<List<UsuarioDTO>> findAll() {
        try {
            return ResponseEntity.ok(usuarioService.findAll());
        } catch (Exception e) {
            log.error("Error llamando a los usuarios: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }*/

    @GetMapping("/password-recovery")
    public ResponseEntity<String> testPasswordRecovery() {
        Random r = new Random();
        int ra = r.nextInt(100000, 999999);
        emailService.sendPassword("nicolascresposuarez@gmail.com", String.valueOf(ra));
        return ResponseEntity.ok("Email sent");
    }

    @PostMapping
    public ResponseEntity<Void> save(@RequestBody UsuarioRequest dto) {
        try {
            usuarioService.save(dto, empresaRepository, sucursalRepository, rolRepository);
            return ResponseEntity.status(HttpStatus.CREATED).build();
        } catch (OperationException e) {
            log.error("Error creando nuevo usuario: {}", e.getMessage());
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
        } catch (Exception e) {
            log.error("Error creando nuevo usuario", e);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Se generó un error genérico al guardar usuario");
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<UsuarioDTO> update(@PathVariable UUID id,
                                             @RequestBody UsuarioRequest dto) {
        try {
            return usuarioService.update(id, dto,
                            empresaRepository, sucursalRepository, rolRepository)
                    .map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        } catch (OperationException e) {
            log.error("Error actualizando usuario: {}", e.getMessage());
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
        } catch (Exception e) {
            log.error("Error actualizando usuario", e);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Se generó un error genérico al actualizar usuario");
        }
    }

    @GetMapping()
    public ResponseEntity<Page<UsuarioDTO>> logs(@RequestParam(value = "page", defaultValue = "0") Integer page,
                                                 @RequestParam(value = "size", defaultValue = "10") Integer size,
                                                 @RequestParam(value = "sortBy", defaultValue = "createdDate") String sortBy,
                                                 @RequestParam(value = "sortDir", defaultValue = "DESC") Sort.Direction sortDir,

                                                 @RequestParam(value = "from", required = false) @DateTimeFormat(pattern = "yyyy-MM-dd") Date from,
                                                 @RequestParam(value = "to", required = false) @DateTimeFormat(pattern = "yyyy-MM-dd") Date to) {

        try {
            LocalDateTime pInit = from != null ? from.toInstant().atZone(ZoneId.systemDefault()).toLocalDateTime() : null;
            LocalDateTime pEnd  = to   != null ? to.toInstant().atZone(ZoneId.systemDefault()).toLocalDateTime()   : null;
            return ResponseEntity.ok(usuarioService.findAllByOrderByDateDesc(pInit, pEnd,
                    PageRequest.of(page, size, Sort.by(sortDir, sortBy))));
        } catch (OperationException e) {
            log.error("Error al listar usuarios: {}", e.getMessage());
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
        } catch (Exception e) {
            log.error("Error al listar usuarios", e);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Se generó un error genérico al listar usuarios");
        }
    }
}
