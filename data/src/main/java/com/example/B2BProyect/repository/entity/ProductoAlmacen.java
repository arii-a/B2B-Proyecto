package com.example.B2BProyect.repository.entity;

import com.example.B2BProyect.repository.entity.Almacen;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.ColumnDefault;

import java.math.BigDecimal;

@Getter
@Setter
@Entity
@Table(name = "producto_almacen", indexes = {
        @Index(name = "idx_prodalmacen_id_producto", columnList = "id_producto")
})
public class ProductoAlmacen {
    @EmbeddedId
    private ProductoAlmacenId id;

    @JsonIgnore
    @MapsId("idAlmacen")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_almacen", nullable = false)
    private Almacen almacen;

    @JsonIgnore
    @MapsId("idProducto")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_producto", nullable = false)
    private Producto producto;

    @ColumnDefault("0")
    @Column(name = "stock", nullable = false)
    private Integer stock;

    @Column(name = "max", precision = 14, scale = 2)
    private BigDecimal max;

    @Column(name = "min", precision = 14, scale = 2)
    private BigDecimal min;

    @ColumnDefault("true")
    @Column(name = "activo", nullable = false)
    private Boolean activo = false;

}