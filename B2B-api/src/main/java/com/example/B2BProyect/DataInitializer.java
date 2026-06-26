package com.example.B2BProyect;


import com.example.B2BProyect.job.EmailSenderJob;
import com.example.B2BProyect.quartz.CronExpressionConstant;
import com.example.B2BProyect.quartz.service.JobDto;
import com.example.B2BProyect.quartz.service.JobService;
import com.example.B2BProyect.quartz.service.JobUtil;
import com.example.B2BProyect.repository.CargoEmpresaRepository;
import com.example.B2BProyect.repository.CategoriaRepository;
import com.example.B2BProyect.repository.EmpresaRepository;
import com.example.B2BProyect.repository.RolUsuarioRepository;
import com.example.B2BProyect.repository.UnidadMedidaRepository;
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
    private final CargoEmpresaRepository cargoEmpresaRepository;
    private final CategoriaRepository categoriaRepository;
    private final UnidadMedidaRepository unidadMedidaRepository;
    private final EmpresaRepository empresaRepository;
    private final SucursalEmpresaRepository sucursalEmpresaRepository;
    private final UsuarioRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private final JobService jobService;

    @Override
    public void run(String... args) throws Exception {
        initCatalogos();
        init();

        JobDto jobDto = EmailSenderJob.getJobDto(JobUtil.GROUP_NAME);
        if (!jobService.existJobName(jobDto.getGroupName(), jobDto.getJobName())){
            jobService.scheduleCronJob(jobDto, new Date(), CronExpressionConstant.CRON_START_NOW, null, "Este Job envia correos");
        }

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

//        emailService.sendFactura("santiagovillanueva1@upb.edu", factura);
    }

    private void initCatalogos() {
        // ── Roles ──────────────────────────────────────────────────────
        if (rolUsuarioRepository.count() == 0) {
            List.of(
                new String[]{"admin",     "Administrador del sistema"},
                new String[]{"empresa",   "Empresa compradora"},
                new String[]{"proveedor", "Proveedor de productos"}
            ).forEach(r -> {
                RolUsuario rol = new RolUsuario();
                rol.setNombre(r[0]);
                rol.setDescripcion(r[1]);
                rolUsuarioRepository.save(rol);
            });
        }

        // ── Cargos de empresa ──────────────────────────────────────────
        if (cargoEmpresaRepository.count() == 0) {
            List.of(
                "Gerente General",
                "Director Comercial",
                "Jefe de Compras",
                "Administrador",
                "Representante Legal"
            ).forEach(nombre -> {
                CargoEmpresa cargo = new CargoEmpresa();
                cargo.setNombre(nombre);
                cargoEmpresaRepository.save(cargo);
            });
        }

        // ── Categorías de producto ─────────────────────────────────────
        if (categoriaRepository.count() == 0) {
            List.of(
                new String[]{"Frutas y Verduras",              "Productos frescos de temporada: tomates, lechugas, bananas, manzanas y hortalizas"},
                new String[]{"Carnes y Mariscos",              "Res, pollo, cerdo, pescado, mariscos frescos y embutidos"},
                new String[]{"Panadería y Tortillería",        "Pan fresco, tortillas, pasteles, bizcochos y productos de horno"},
                new String[]{"Lácteos, Huevos y Quesos",       "Leche, yogur, mantequilla, crema, quesos y huevos"},
                new String[]{"Congelados",                     "Pizzas, nuggets, helados, vegetales congelados y comidas listas para calentar"},
                new String[]{"Despensa y Abarrotes",           "Arroz, azúcar, aceite, fideos, harina, enlatados y conservas"},
                new String[]{"Desayuno y Cereales",            "Avena, cereales, granola, leches vegetales, mermeladas y jugos de caja"},
                new String[]{"Snacks, Dulces y Chocolates",    "Papas fritas, palomitas, galletas, chicles, caramelos y barras de chocolate"},
                new String[]{"Bebidas y Jugos",                "Aguas, refrescos, jugos naturales, energizantes, infusiones y bebidas isotónicas"},
                new String[]{"Bebidas Alcohólicas",            "Cervezas, vinos, licores, ron, whisky y espumantes"},
                new String[]{"Limpieza del Hogar",             "Detergentes, limpiapisos, desengrasantes, esponjas, escobas y bolsas de basura"},
                new String[]{"Cuidado Personal",               "Shampoo, acondicionador, jabón, desodorante, pasta dental y maquillaje"},
                new String[]{"Bebés y Maternidad",             "Pañales, fórmula, papillas, ropa de bebé, biberones y artículos de cuna"},
                new String[]{"Salud y Farmacia",               "Medicamentos de venta libre, vitaminas, termómetros, vendas y primeros auxilios"},
                new String[]{"Electrónica y Tecnología",       "Televisores, computadoras, tablets, parlantes, audífonos y accesorios"},
                new String[]{"Electrodomésticos",              "Refrigeradoras, lavadoras, microondas, licuadoras, cocinas y ventiladores"},
                new String[]{"Ropa, Calzado y Accesorios",    "Camisetas, pantalones, zapatos, ropa interior, carteras y cinturones"},
                new String[]{"Juguetes y Entretenimiento",     "Muñecas, autos de juguete, juegos de mesa, consolas y material didáctico"},
                new String[]{"Deportes y Aire Libre",          "Pelotas, bicicletas, ropa deportiva, pesas, carpas y artículos de camping"},
                new String[]{"Mascotas",                       "Alimento para perros y gatos, accesorios, juguetes, arena sanitaria y medicamentos"}
            ).forEach(c -> {
                Categoria cat = new Categoria();
                cat.setNombre(c[0]);
                cat.setDescripcion(c[1]);
                categoriaRepository.save(cat);
            });
        }

        // Unidades de medida base
        if (unidadMedidaRepository.count() == 0) {
            List.of(
                new String[]{"Unidad", "und"},
                new String[]{"Caja", "caja"},
                new String[]{"Bolsa", "bol"},
                new String[]{"Paquete", "paq"},
                new String[]{"Kilogramo", "kg"},
                new String[]{"Litro", "l"},
                new String[]{"Metro", "m"}
            ).forEach(u -> {
                UnidadMedida unidad = new UnidadMedida();
                unidad.setNombre(u[0]);
                unidad.setAbreviatura(u[1]);
                unidadMedidaRepository.save(unidad);
            });
        }
    }

    private void init() {
        if (userRepository.count() == 0) {
            RolUsuario rolAdmin = rolUsuarioRepository.findAll()
                    .stream()
                    .filter(r -> r.getNombre().equals("admin"))
                    .findFirst()
                    .orElseGet(() -> {
                        RolUsuario nuevo = new RolUsuario();
                        nuevo.setNombre("admin");
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
