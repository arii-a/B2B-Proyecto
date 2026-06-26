# API Endpoints

**Base URL:** `http://localhost:8080`  
**Authentication:** Bearer JWT token in `Authorization` header (except public endpoints)  
**Public endpoints:** `POST /api/v1/auth/login`, `POST /api/v1/auth/register`, `POST /api/v1/auth/password-reset/*`, `/swagger-ui/**`, `/v3/api-docs/**`, `/ws/**`

---

## Auth

| Method | Path | Body | Query Params | Response |
|--------|------|------|--------------|----------|
| POST | `/api/v1/auth/login` | `AuthenticationDTO` | — | `OKAuthDto` |
| POST | `/api/v1/auth/register` | `RegisterRequest` | — | `OKAuthDto` |
| POST | `/api/v1/auth/password-reset/request` | — | `email` | `String` |
| POST | `/api/v1/auth/password-reset/confirm` | — | `email`, `code`, `newPassword` | `String` |

---

## Usuarios

| Method | Path | Body | Path Vars | Query Params | Response |
|--------|------|------|-----------|--------------|----------|
| GET | `/api/v1/usuarios` | — | — | `page`(0), `size`(10), `sortBy`(createdDate), `sortDir`(DESC), `from`(yyyy-MM-dd), `to`(yyyy-MM-dd) | `Page<UsuarioDTO>` |
| POST | `/api/v1/usuarios` | `UsuarioRequest` | — | — | `201` |
| PUT | `/api/v1/usuarios/{id}` | `UsuarioRequest` | `UUID id` | — | `UsuarioDTO` |
| GET | `/api/v1/usuarios/password-recovery` | — | — | — | `String` |

---

## Empresas

| Method | Path | Body | Path Vars | Query Params | Response |
|--------|------|------|-----------|--------------|----------|
| GET | `/api/v1/empresas` | — | — | `page`(0), `size`(10), `sortBy`(nombre) | `Page<EmpresaDTO>` |
| POST | `/api/v1/empresas` | `EmpresaRequest` | — | — | `EmpresaDTO 201` |
| PUT | `/api/v1/empresas/{id}` | `EmpresaRequest` | `UUID id` | — | `EmpresaDTO` |
| DELETE | `/api/v1/empresas/{id}` | — | `UUID id` | — | `204` |
| POST | `/api/v1/empresas/examen` | `String` | — | — | `200` |

---

## Sucursales de Empresa

| Method | Path | Body | Path Vars | Query Params | Response |
|--------|------|------|-----------|--------------|----------|
| GET | `/api/v1/sucursales-empresa` | — | — | — | `List<SucursalEmpresaDTO>` |
| POST | `/api/v1/sucursales-empresa` | `SucursalEmpresaRequest` | — | — | `SucursalEmpresaDTO 201` |
| PUT | `/api/v1/sucursales-empresa/{id}` | `SucursalEmpresaRequest` | `UUID id` | — | `SucursalEmpresaDTO` |
| DELETE | `/api/v1/sucursales-empresa/{id}` | — | `UUID id` | — | `204` |

---

## Proveedores

| Method | Path | Body | Path Vars | Query Params | Response |
|--------|------|------|-----------|--------------|----------|
| GET | `/api/v1/proveedores` | — | — | — | `List<ProveedorDTO>` |
| POST | `/api/v1/proveedores/{id_empresa}` | `ProveedorRequest` | `UUID id_empresa` | — | `201` |
| PUT | `/api/v1/proveedores/{id}` | `ProveedorRequest` | `UUID id` | — | `ProveedorDTO` |
| DELETE | `/api/v1/proveedores/{id}` | — | `UUID id` | — | `204` |

---

## Categorías de Proveedor

| Method | Path | Body | Query Params | Response |
|--------|------|------|--------------|----------|
| GET | `/api/v1/categorias-proveedor` | — | — | `List<CatProveedorDTO>` |
| POST | `/api/v1/categorias-proveedor` | `CatProveedorRequest` | — | `201` |

---

## Productos

| Method | Path | Body | Path Vars | Query Params | Response |
|--------|------|------|-----------|--------------|----------|
| GET | `/api/v1/products` | — | — | — | `List<ProductoDTO>` |
| GET | `/api/v1/products/paged` | — | — | `page`(0), `size`(10) | `Page<ProductoDTO>` |
| GET | `/api/v1/products/proveedor/{idProveedor}` | — | `UUID idProveedor` | — | `List<ProductoDTO>` |
| POST | `/api/v1/products` | `ProductoRequest` | — | — | `ProductoDTO 201` |
| PUT | `/api/v1/products/{id}` | `ProductoRequest` | `UUID id` | — | `ProductoDTO` |
| DELETE | `/api/v1/products/{id}` | — | `UUID id` | — | `204` |

---

## Categorías

| Method | Path | Body | Path Vars | Query Params | Response |
|--------|------|------|-----------|--------------|----------|
| GET | `/api/v1/categorias` | — | — | — | `List<CategoriaDTO>` |
| POST | `/api/v1/categorias` | `CategoriaRequest` | — | — | `201` |
| PUT | `/api/v1/categorias/{id}` | `CategoriaRequest` | `UUID id` | — | `CategoriaDTO` |
| DELETE | `/api/v1/categorias/{id}` | — | `UUID id` | — | `204` |

---

## Unidades de Medida

| Method | Path | Body | Path Vars | Query Params | Response |
|--------|------|------|-----------|--------------|----------|
| GET | `/api/v1/unidades-medida` | — | — | — | `List<UnidadMedidaDTO>` |
| GET | `/api/v1/unidades-medida/activas` | — | — | — | `List<UnidadMedidaDTO>` |
| POST | `/api/v1/unidades-medida` | `UnidadMedidaRequest` | — | — | `UnidadMedidaDTO 201` |
| PUT | `/api/v1/unidades-medida/{id}` | `UnidadMedidaRequest` | `UUID id` | — | `UnidadMedidaDTO` |
| DELETE | `/api/v1/unidades-medida/{id}` | — | `UUID id` | — | `204` |

---

## Almacenes

| Method | Path | Body | Path Vars | Query Params | Response |
|--------|------|------|-----------|--------------|----------|
| GET | `/api/v1/almacenes` | — | — | — | `List<AlmacenDTO>` |
| POST | `/api/v1/almacenes` | `AlmacenRequest` | — | — | `201` |
| PUT | `/api/v1/almacenes/{id}` | `AlmacenRequest` | `UUID id` | — | `AlmacenDTO` |
| DELETE | `/api/v1/almacenes/{id}` | — | `UUID id` | — | `204` |

---

## Producto–Almacén

| Method | Path | Body | Path Vars | Query Params | Response |
|--------|------|------|-----------|--------------|----------|
| GET | `/api/v1/producto-almacen` | — | — | — | `List<ProductoAlmacenDTO>` |
| GET | `/api/v1/producto-almacen/almacen/{idAlmacen}` | — | `UUID idAlmacen` | — | `List<ProductoAlmacenDTO>` |
| POST | `/api/v1/producto-almacen` | `ProductoAlmacenRequest` | — | — | `201` |
| PUT | `/api/v1/producto-almacen/{idAlmacen}/{idProducto}` | `ProductoAlmacenRequest` | `UUID idAlmacen`, `UUID idProducto` | — | `ProductoAlmacenDTO` |
| DELETE | `/api/v1/producto-almacen/{idAlmacen}/{idProducto}` | — | `UUID idAlmacen`, `UUID idProducto` | — | `204` |

---

## Precios Base

| Method | Path | Body | Path Vars | Query Params | Response |
|--------|------|------|-----------|--------------|----------|
| GET | `/api/v1/precios-base` | — | — | — | `List<PrecioBaseDTO>` |
| POST | `/api/v1/precios-base` | `PrecioBaseRequest` | — | — | `201` |
| PUT | `/api/v1/precios-base/{id}` | `PrecioBaseRequest` | `UUID id` | — | `PrecioBaseDTO` |
| DELETE | `/api/v1/precios-base/{id}` | — | `UUID id` | — | `204` |

---

## Contratos – Tarifa

| Method | Path | Body | Path Vars | Query Params | Response |
|--------|------|------|-----------|--------------|----------|
| GET | `/api/v1/contratos-tarifa` | — | — | — | `List<ContratoEmpresaTarifasDTO>` |
| GET | `/api/v1/contratos-tarifa/paged` | — | — | `page`(0), `size`(10) | `Page<ContratoEmpresaTarifasDTO>` |
| POST | `/api/v1/contratos-tarifa` | `ContratoEmpresaTarifaRequest` | — | — | `ContratoEmpresaTarifasDTO 201` |
| PUT | `/api/v1/contratos-tarifa/{id}` | `ContratoEmpresaTarifaRequest` | `UUID id` | — | `ContratoEmpresaTarifasDTO` |
| DELETE | `/api/v1/contratos-tarifa/{id}` | — | `UUID id` | — | `204` |

---

## Contratos – Detalle

| Method | Path | Body | Path Vars | Query Params | Response |
|--------|------|------|-----------|--------------|----------|
| GET | `/api/v1/contratos-detalle` | — | — | — | `List<ContratoEmpresaDetalleDTO>` |
| POST | `/api/v1/contratos-detalle` | `ContratoEmpresaDetalleRequest` | — | — | `201` |
| PUT | `/api/v1/contratos-detalle/{id}` | `ContratoEmpresaDetalleRequest` | `UUID id` | — | `ContratoEmpresaDetalleDTO` |
| DELETE | `/api/v1/contratos-detalle/{id}` | — | `UUID id` | — | `204` |

---

## Tramos de Tarifa

| Method | Path | Body | Path Vars | Query Params | Response |
|--------|------|------|-----------|--------------|----------|
| GET | `/api/v1/tramos-tarifa` | — | — | — | `List<TramoTarifaDTO>` |
| POST | `/api/v1/tramos-tarifa` | `TramoTarifaRequest` | — | — | `TramoTarifaDTO 201` |
| PUT | `/api/v1/tramos-tarifa/{id}` | `TramoTarifaRequest` | `UUID id` | — | `TramoTarifaDTO` |
| DELETE | `/api/v1/tramos-tarifa/{id}` | — | `UUID id` | — | `204` |

---

## Comisiones

| Method | Path | Body | Path Vars | Query Params | Response |
|--------|------|------|-----------|--------------|----------|
| GET | `/api/v1/comisiones` | — | — | — | `List<ComisionDTO>` |
| POST | `/api/v1/comisiones` | `ComisionRequest` | — | — | `201` |
| PUT | `/api/v1/comisiones/{id}` | `ComisionRequest` | `UUID id` | — | `ComisionDTO` |
| DELETE | `/api/v1/comisiones/{id}` | — | `UUID id` | — | `204` |

---

## Reglas de Comisión

| Method | Path | Body | Path Vars | Query Params | Response |
|--------|------|------|-----------|--------------|----------|
| GET | `/api/v1/reglas-comision` | — | — | — | `List<ReglasComisionDTO>` |
| POST | `/api/v1/reglas-comision` | `ReglasComisionRequest` | — | — | `201` |
| PUT | `/api/v1/reglas-comision/{id}` | `ReglasComisionRequest` | `UUID id` | — | `ReglasComisionDTO` |
| DELETE | `/api/v1/reglas-comision/{id}` | — | `UUID id` | — | `204` |

---

## Roles de Usuario

| Method | Path | Body | Path Vars | Query Params | Response |
|--------|------|------|-----------|--------------|----------|
| GET | `/api/v1/roles` | — | — | — | `List<RolUsuarioDTO>` |
| POST | `/api/v1/roles` | `RolUsuarioRequest` | — | — | `201` |
| PUT | `/api/v1/roles/{id}` | `RolUsuarioRequest` | `UUID id` | — | `RolUsuarioDTO` |
| DELETE | `/api/v1/roles/{id}` | — | `UUID id` | — | `204` |

---

## Cargos de Empresa

| Method | Path | Body | Path Vars | Query Params | Response |
|--------|------|------|-----------|--------------|----------|
| GET | `/api/v1/cargos-empresa` | — | — | — | `List<CargoEmpresaDTO>` |
| POST | `/api/v1/cargos-empresa` | `CargoEmpresaRequest` | — | — | `201` |
| PUT | `/api/v1/cargos-empresa/{id}` | `CargoEmpresaRequest` | `UUID id` | — | `CargoEmpresaDTO` |
| DELETE | `/api/v1/cargos-empresa/{id}` | — | `UUID id` | — | `204` |

---

## Contactos de Empresa

| Method | Path | Body | Path Vars | Query Params | Response |
|--------|------|------|-----------|--------------|----------|
| GET | `/api/v1/contactos-empresa` | — | — | — | `List<ContactosEmpresaDTO>` |
| POST | `/api/v1/contactos-empresa` | `ContactosEmpresaRequest` | — | — | `201` |
| PUT | `/api/v1/contactos-empresa/{id}` | `ContactosEmpresaRequest` | `UUID id` | — | `ContactosEmpresaDTO` |
| DELETE | `/api/v1/contactos-empresa/{id}` | — | `UUID id` | — | `204` |

---

## Órdenes de Compra

| Method | Path | Body | Path Vars | Query Params | Response |
|--------|------|------|-----------|--------------|----------|
| GET | `/api/v1/ordenes-compra` | — | — | — | `List<OrdenCompraDTO>` |
| GET | `/api/v1/ordenes-compra/paged` | — | — | `page`(0), `size`(10) | `Page<OrdenCompraDTO>` |
| POST | `/api/v1/ordenes-compra` | `OrdenCompraRequest` | — | — | `OrdenCompraDTO 201` |
| PUT | `/api/v1/ordenes-compra/{id}` | `OrdenCompraRequest` | `UUID id` | — | `OrdenCompraDTO` |
| DELETE | `/api/v1/ordenes-compra/{id}` | — | `UUID id` | — | `204` |

---

## Detalle de Orden

| Method | Path | Body | Path Vars | Query Params | Response |
|--------|------|------|-----------|--------------|----------|
| GET | `/api/v1/detalle-orden` | — | — | — | `List<DetalleOrdenDTO>` |
| POST | `/api/v1/detalle-orden` | `DetalleOrdenRequest` | — | — | `201` |
| PUT | `/api/v1/detalle-orden/{id}` | `DetalleOrdenRequest` | `UUID id` | — | `DetalleOrdenDTO` |
| DELETE | `/api/v1/detalle-orden/{id}` | — | `UUID id` | — | `204` |

---

## Facturas

| Method | Path | Body | Path Vars | Query Params | Response |
|--------|------|------|-----------|--------------|----------|
| GET | `/api/v1/facturas` | — | — | — | `List<FacturaDTO>` |
| GET | `/api/v1/facturas/paged` | — | — | `page`(0), `size`(10) | `Page<FacturaDTO>` |
| POST | `/api/v1/facturas` | `FacturaRequest` | — | — | `201` |
| PUT | `/api/v1/facturas/{id}` | `FacturaRequest` | `UUID id` | — | `FacturaDTO` |
| DELETE | `/api/v1/facturas/{id}` | — | `UUID id` | — | `204` |

---

## Detalle de Factura

| Method | Path | Body | Path Vars | Query Params | Response |
|--------|------|------|-----------|--------------|----------|
| GET | `/api/v1/detalle-factura` | — | — | — | `List<DetalleFacturaDTO>` |
| POST | `/api/v1/detalle-factura` | `DetalleFacturaRequest` | — | — | `201` |
| PUT | `/api/v1/detalle-factura/{id}` | `DetalleFacturaRequest` | `UUID id` | — | `DetalleFacturaDTO` |
| DELETE | `/api/v1/detalle-factura/{id}` | — | `UUID id` | — | `204` |

---

## Pagos (Stereum)

| Method | Path | Body | Path Vars | Query Params | Response |
|--------|------|------|-----------|--------------|----------|
| POST | `/api/v1/stereum/charge` | `PaymentRequest` | — | — | `Object` |
| POST | `/api/v1/stereum/outbound` | `String` | — | — | `200` (Headers: `X-Signature`, `X-Timestamp`) |
| POST | `/api/pagos/crear-cobro` | `Map<String, Object>` | — | — | `Object` |

---

## API Keys

> Requires `@AuthenticationPrincipal` — the authenticated `Usuario` is resolved from the JWT.

| Method | Path | Body | Path Vars | Query Params | Response |
|--------|------|------|-----------|--------------|----------|
| GET | `/api/v1/api-keys` | — | — | — | `List<ApiKeyDTO>` |
| POST | `/api/v1/api-keys` | `ApiKeyRequest` | — | — | `ApiKeyCreatedDTO 201` |
| DELETE | `/api/v1/api-keys/{id}` | — | `UUID id` | — | `204` |

---

## Logs

| Method | Path | Body | Query Params | Response |
|--------|------|------|--------------|----------|
| GET | `/api/v1/logs` | — | `page`(0), `size`(10), `sortBy`(createdDate), `sortDir`(DESC), `from`(yyyy-MM-dd), `to`(yyyy-MM-dd) | `Page<Log>` |

---

## Upload

| Method | Path | Body | Response |
|--------|------|------|----------|
| POST | `/api/v1/upload` | `multipart/form-data` — param `file` (`MultipartFile`) | `Map<String, String>` |

---

## Summary

| Stat | Count |
|------|-------|
| Controllers | 28 |
| Total endpoints | 122 |
| Endpoints with pagination | 7 |
