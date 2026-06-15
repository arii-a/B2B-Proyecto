package com.example.B2BProyect.repository;

import com.example.B2BProyect.repository.entity.Log;
import jakarta.transaction.Transactional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;

public interface LogRepository extends JpaRepository<Log, String> {
    @Query("SELECT l FROM Log l WHERE l.createdDate BETWEEN :pInit AND :pEnd")
    Page<Log> findAllByOrderByDateDesc(
            @Param("pInit") LocalDateTime pInit,
            @Param("pEnd") LocalDateTime pEnd,
            Pageable pageable);
}
