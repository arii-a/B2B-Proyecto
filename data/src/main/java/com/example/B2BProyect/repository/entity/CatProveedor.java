package com.example.B2BProyect.repository.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
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

    @JsonIgnore
    @MapsId("idCategoria")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_categoria", nullable = false)
    private Categoria idCategoria;

    @JsonIgnore
    @MapsId("idProveedor")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_proveedor", nullable = false)
    private Proveedor idProveedor;

}