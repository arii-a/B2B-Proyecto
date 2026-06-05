package com.example.B2BProyect.config;

import com.example.B2BProyect.repository.dto.OKAuthDto;
import com.example.B2BProyect.repository.entity.Usuario;
import com.example.B2BProyect.service.UsuarioService;
import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Component;
import com.example.B2BProyect.service.exception.NotDataFoundException;
import com.example.B2BProyect.service.exception.InvalidJwtAuthenticationException;

import javax.crypto.SecretKey;
import java.io.Serializable;
import java.util.Base64;
import java.util.Calendar;
import java.util.Date;
import java.util.Optional;

@Slf4j
@Component
public class JwtTokenProvider implements Serializable {
    private static final String USER_ID_CLAIM = "user_id";

    @Value("${security.jwt.token.secret-key}")
    private String secretKey;
    private byte[] secretKeyByte;
    @Value("${security.jwt.token.expire-length:28800000}")
    private int validityInMinutes;
    @Autowired
    private UsuarioService userService;



    @PostConstruct
    protected void init() {
        secretKeyByte = Base64.getDecoder().decode(secretKey);
    }

    public OKAuthDto createToken(Usuario user) {
        Date now = new Date();
        Date validity = plusMinutes(now, this.validityInMinutes);
        Claims claims = Jwts.claims()
                .subject(user.getUsername())
                .id(user.getId().toString())
                .issuedAt(new Date())
                .expiration(validity)
                .build();
        //claims.put(USER_ID_CLAIM, user.getId());

        SecretKey secretKey = Keys.hmacShaKeyFor(secretKeyByte);
        String token = Jwts.builder()
                .claims(claims)
                .expiration(validity)
                .signWith(secretKey)
                .compact();

        return OKAuthDto.builder()
                .accessToken(token)
                .idToken(token)
                .refreshToken(token)
                .tokenType("bearer")
                .expiresIn(this.validityInMinutes)
                .expiresAt(validity.getTime())
                .build();
    }


    private String getId(String token) {
        SecretKey secretKey = Keys.hmacShaKeyFor(secretKeyByte);
        return Jwts.parser()
                .verifyWith(secretKey)
                .build()
                .parseSignedClaims(token)
                .getPayload()
                .getSubject();
    }

    public String resolveToken(String bearerToken) {
        if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
            try {
                return bearerToken.substring(7);
            } catch (NotDataFoundException e) {
                log.error("Usuario no encontrado");
                return null;
            }
        }
        return null;
    }

    public Optional<Authentication> validateToken(String token) {
        try {
            SecretKey secretKey = Keys.hmacShaKeyFor(secretKeyByte);
            Jws<Claims> claims = Jwts.parser()
                    .verifyWith(secretKey)
                    .build()
                    .parseSignedClaims(token);
            if (claims.getBody().getExpiration().after(new Date())) {
                Usuario authUser = this.userService.findByEmailToValidateSession(getId(token)).orElseThrow(() -> new UsernameNotFoundException("Autenticación incorrecta"));
                log.info(authUser.toString());
                return Optional.of(new UsernamePasswordAuthenticationToken(authUser, "", authUser.getAuthorities()));
            }
            return Optional.empty();
        } catch (ExpiredJwtException e) {
            log.warn("La sesión del usuario a expirado");
            throw e;
        } catch (JwtException | IllegalArgumentException e) {
            log.error("Error al validar el TOKEN", e);
            throw new InvalidJwtAuthenticationException("Token JWT caducado o no válido.");
        }
    }

    public  Date plusMinutes(Date date, int minutesToAdd) {
        Calendar calDateStart = Calendar.getInstance();
        calDateStart.setTime(date);
        calDateStart.add(Calendar.MINUTE, minutesToAdd);

        return calDateStart.getTime();
    }
}
