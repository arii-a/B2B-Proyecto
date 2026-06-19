package com.example.B2BProyect.repository;

import com.example.B2BProyect.repository.entity.OrdenCompra;
import com.example.B2BProyect.repository.entity.PasswordResetToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface PasswordResetTokensRepository extends JpaRepository<PasswordResetToken, UUID> {
    @Query("SELECT new PasswordResetToken (pr.id, pr.email, pr.code, pr.expiresAt, pr.used) FROM PasswordResetToken pr where pr.email=:prEmail AND pr.code=:prCode AND pr.used=false")
    Optional<PasswordResetToken> findByEmailAndCodeAndUsedFalse(@Param("prEmail") String email, @Param("prCode") String code);
    void deleteByEmail(String email);
}
