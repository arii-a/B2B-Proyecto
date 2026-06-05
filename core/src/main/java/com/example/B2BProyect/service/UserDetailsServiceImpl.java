package com.example.B2BProyect.service;

import com.example.B2BProyect.repository.UsuarioRepository;
import com.example.B2BProyect.repository.entity.Usuario;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.extern.slf4j.Slf4j;


@RequiredArgsConstructor
@Slf4j
@Service
public class UserDetailsServiceImpl implements UserDetailsService {
    private final UsuarioRepository userRepository;


    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        Usuario authUser = this.userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("No existe el usuario"));
        String password = authUser.getPassword();
        return new org.springframework.security.core.userdetails.User(
                authUser.getEmail(),
                password,
                authUser.isEnabled(),
                true,
                authUser.isAccountNonExpired(),
                true,
                authUser.getAuthorities()
        );
    }

}