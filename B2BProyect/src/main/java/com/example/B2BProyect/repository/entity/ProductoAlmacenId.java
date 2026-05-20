package com.example.B2BProyect.repository.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.Hibernate;

import java.io.Serializable;
import java.util.Objects;
import java.util.UUID;

@Getter
@Setter
@Embeddable
public class ProductoAlmacenId implements Serializable {
    private static final long serialVersionUID = -3726749609239796637L;
    @Column(name = "id_almacen", nullable = false)
    private UUID id_almacen;

    @Column(name = "id_producto", nullable = false)
    private UUID id_producto;

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || Hibernate.getClass(this) != Hibernate.getClass(o)) return false;
        ProductoAlmacenId entity = (ProductoAlmacenId) o;
        return Objects.equals(this.id_almacen, entity.id_almacen) &&
                Objects.equals(this.id_producto, entity.id_producto);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id_almacen, id_producto);
    }

}