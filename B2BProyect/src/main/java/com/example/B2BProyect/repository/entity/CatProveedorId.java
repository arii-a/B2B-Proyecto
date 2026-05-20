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
public class CatProveedorId implements Serializable {
    private static final long serialVersionUID = -5053715914545723979L;
    @Column(name = "id_categoria", nullable = false)
    private UUID id_categoria;

    @Column(name = "id_proveedor", nullable = false)
    private UUID id_proveedor;

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || Hibernate.getClass(this) != Hibernate.getClass(o)) return false;
        CatProveedorId entity = (CatProveedorId) o;
        return Objects.equals(this.id_proveedor, entity.id_proveedor) &&
                Objects.equals(this.id_categoria, entity.id_categoria);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id_proveedor, id_categoria);
    }

}