package com.example.B2BProyect.controller;

import com.example.B2BProyect.service.exception.OperationException;
import com.example.B2BProyect.repository.entity.Log;
import com.example.B2BProyect.service.LogService;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;

import java.time.ZoneId;
import java.util.Date;

@Slf4j
@AllArgsConstructor
@RestController
@RequestMapping("/api/v1/logs")
public class LogController {
    private final LogService logService;

    @GetMapping()
    public ResponseEntity<Page<Log>> logs(@RequestParam(value = "page", defaultValue = "0") Integer page,
                                          @RequestParam(value = "size", defaultValue = "10") Integer size,
                                          @RequestParam(value = "sortBy", defaultValue = "createdDate") String sortBy,
                                          @RequestParam(value = "sortDir", defaultValue = "DESC") Sort.Direction sortDir,

                                          @RequestParam("from") @DateTimeFormat(pattern = "yyyy-MM-dd") Date from,
                                          @RequestParam("to") @DateTimeFormat(pattern = "yyyy-MM-dd") Date to) {

        try {
            return ResponseEntity.ok(logService.findAllByOrderByDateDesc(from.toInstant()
                            .atZone(ZoneId.systemDefault()).toLocalDateTime(),
                    to.toInstant().atZone(ZoneId.systemDefault()).toLocalDateTime(),

                    PageRequest.of(page, size, Sort.by(sortDir, sortBy)))
            );
        } catch (OperationException e) {
            log.error("Error al listar logs: {}", e.getMessage());
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
        } catch (Exception e) {
            log.error("Error al listar logs", e);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Se generó un error genérico al listar logs");
        }
    }
}