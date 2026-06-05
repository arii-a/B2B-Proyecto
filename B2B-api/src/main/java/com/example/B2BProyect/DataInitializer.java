package com.example.B2BProyect;


import com.example.B2BProyect.repository.EmpresaRepository;
import com.example.B2BProyect.repository.RolUsuarioRepository;
import com.example.B2BProyect.repository.SucursalEmpresaRepository;
import com.example.B2BProyect.repository.UsuarioRepository;
import com.example.B2BProyect.repository.entity.Empresa;
import com.example.B2BProyect.repository.entity.RolUsuario;
import com.example.B2BProyect.repository.entity.SucursalEmpresa;
import com.example.B2BProyect.repository.entity.Usuario;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@AllArgsConstructor
public class DataInitializer implements CommandLineRunner {
    private final RolUsuarioRepository rolUsuarioRepository;
    private final EmpresaRepository empresaRepository;
    private final SucursalEmpresaRepository sucursalEmpresaRepository;
    private final UsuarioRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        init();
    }

    private void init() {
        if (userRepository.count() == 0 ) {
            RolUsuario rolAdmin = rolUsuarioRepository.findAll()
                    .stream()
                    .filter(r -> r.getNombre().equals("ADMIN"))
                    .findFirst()
                    .orElseGet(() -> {
                        RolUsuario nuevo = new RolUsuario();
                        nuevo.setNombre("ADMIN");
                        nuevo.setDescripcion("Administrador del sistema");
                        return rolUsuarioRepository.save(nuevo);
                    });

            Empresa empresa = empresaRepository.findAll()
                    .stream()
                    .filter(e -> e.getNombre().equals("Empresa Root"))
                    .findFirst()
                    .orElseGet(() -> {
                        Empresa nueva = new Empresa();
                        nueva.setNombre("Cuanto Menos");
                        nueva.setNit("0000000000");
                        nueva.setRazonSocial("B2B Cuanto Menos");
                        nueva.setDominio("cuantomenos.com"); // ?? xd
                        nueva.setActivo(true);
                        return empresaRepository.save(nueva);
                    });

            SucursalEmpresa sucursal = sucursalEmpresaRepository.findAll()
                    .stream()
                    .filter(s -> s.getNombre().equals("Sucursal Principal"))
                    .findFirst()
                    .orElseGet(() -> {
                        SucursalEmpresa nueva = new SucursalEmpresa();
                        nueva.setNombre("Sucursal Principal");
                        nueva.setDireccion("Dirección principal");
                        nueva.setActivo(true);
                        nueva.setIdEmpresa(empresa); // la recién creada
                        return sucursalEmpresaRepository.save(nueva);
                    });

            Usuario root = userRepository.save(Usuario.builder()
                    .nombre("root")
                    .email("root@upb.com")
                    .idRol(rolAdmin) // hay que ver cómo manejar esto
                    .activo(Boolean.TRUE)
                    .passwordHash(passwordEncoder.encode("Abc123**"))
                            .idEmpresa(empresa)
                            .idSucursal(sucursal)
                    .build());
        }
    }
}
