package com.example.B2BProyect.repository.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "cat_proveedor", indexes = {
        @Index(name = "idx_catprov_categoria", columnList = "id_categoria"),
        @Index(name = "idx_catprov_proveedor", columnList = "id_proveedor")
})
public class CatProveedor {
    @EmbeddedId
    private CatProveedorId id;

    @MapsId("id_categoria")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_categoria", nullable = false)
    private Categoria id_categoria;

    @MapsId("id_proveedor")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_proveedor", nullable = false)
    private Proveedor id_proveedor;

}