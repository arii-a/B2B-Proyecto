package com.example.B2BProyect;


import com.example.B2BProyect.repository.EmpresaRepository;
import com.example.B2BProyect.repository.RolUsuarioRepository;
import com.example.B2BProyect.repository.SucursalEmpresaRepository;
import com.example.B2BProyect.repository.UsuarioRepository;
import com.example.B2BProyect.repository.entity.*;
import com.example.B2BProyect.service.EmailService;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;

@Slf4j
@Component
@AllArgsConstructor
public class DataInitializer implements CommandLineRunner {
    private final RolUsuarioRepository rolUsuarioRepository;
    private final EmpresaRepository empresaRepository;
    private final SucursalEmpresaRepository sucursalEmpresaRepository;
    private final UsuarioRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;

    @Override
    public void run(String... args) throws Exception {
        init();
//        emailService.sendPassword("santiagovillanueva1@upb.edu","123546");
        Factura factura = new Factura();

        Empresa empresa = new Empresa();
        empresa.setNombre("Industrias Andinas S.A.");
        empresa.setNit("1029384756");
        empresa.setRazonSocial("Industrias Andinas Sociedad Anonima");

        Producto producto = new Producto();
        producto.setNombre("Monitor LED 24 pulgadas");
        producto.setSku("MON-LED-24");

        DetalleOrden detalle = new DetalleOrden();
        detalle.setCantidad(3);
        detalle.setPrecioUnitario(new BigDecimal("425.50"));
        detalle.setSubtotal(new BigDecimal("1276.50"));
        detalle.setIdProducto(producto);

        OrdenCompra orden = new OrdenCompra();
        orden.setId(UUID.fromString("8f2a6d0c-7b91-4d3e-9c41-2f63c1a8e902"));
        orden.setTotal(new BigDecimal("1276.50"));
        orden.setFecha(Instant.parse("2026-06-18T15:42:00Z"));
        orden.setIdEstado("pagada");
        orden.setIdEmpresaCompradora(empresa);
        orden.setDetalleOrdens(new LinkedHashSet<>(List.of(detalle)));

        detalle.setIdOrden(orden);

        factura.setId(UUID.fromString("3c1d8a5f-6e27-4f83-b9a0-91d7b2e4c620"));
        factura.setFecha(Instant.parse("2026-06-18T15:45:00Z"));
        factura.setTotal(new BigDecimal("1276.50"));
        factura.setIdEstado("pagada");
        factura.setIdOrden(orden);

        emailService.sendFactura("santiagovillanueva1@upb.edu", factura);
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
            userRepository.save(root);
        }
    }
}
