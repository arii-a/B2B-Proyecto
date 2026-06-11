package com.example.B2BProyect.repository;

import com.example.B2BProyect.repository.entity.Log;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LogRepository extends JpaRepository<Log, String> {
}