package com.example.B2BProyect.utils;
import ch.qos.logback.core.util.StringUtil;
import com.example.B2BProyect.repository.dto.response.EmpresaDTO;
import com.example.B2BProyect.service.exception.EmpresasException;
import lombok.SneakyThrows;

import java.lang.reflect.Field;
import java.util.Arrays;
import java.util.UUID;

public class ObjectUtils {
    @SneakyThrows
    public boolean isAValidText(Object object, String campo, int minChar, int maxChar, boolean mandatory, Class<? extends Throwable> exceptionClass) {
        if (object == null || campo == null) {
            throw new IllegalArgumentException("Object and field name cannot be null");
        }
        Object fieldValue;
        try {
            Field f = object.getClass().getDeclaredField(campo);
            f.setAccessible(true);
            fieldValue = f.get(object);
        } catch (Exception e) {
            throw createException(exceptionClass, "No se pudo obtener el valor deseado, verifica el nombre del campo y/o el objeto");
        }
        if (fieldValue == null) {
            if (mandatory) {
                throw createException(exceptionClass, "Valor vacio");
            }
            return true;
        }
        String text = fieldValue.toString();

        if (mandatory && text.trim().isEmpty()) {
            throw createException(exceptionClass, "Valor vacio");
        }
        if (text.length() < minChar || text.length() > maxChar) {
            String message = String.format("Cantidad invalida de caracteres, la cantidad minima es: %d y la cantidad maxima es: %d", minChar, maxChar);
            throw createException(exceptionClass, message);
        }

        return true;
    }

    @SneakyThrows
    private Throwable createException(Class<? extends Throwable> exceptionClass, String message) {
        try {
            return exceptionClass.getConstructor(String.class).newInstance(message);
        } catch (NoSuchMethodException e) {
            return exceptionClass.getDeclaredConstructor().newInstance();
        }
    }

    public Object compareObjects(Object object1, Object object2) {
        Field[] fieldsObj1 = object1.getClass().getDeclaredFields();
        Field[] fieldsObj2 = object2.getClass().getDeclaredFields();
        Field[] fields;
        Object principal; Object dto;
        if (Arrays.equals(fieldsObj1, fieldsObj2)) {
            principal = object1; dto = object2; fields = fieldsObj1;
        } else if (fieldsObj2.length > fieldsObj1.length) {
            fields = fieldsObj1; principal = object2; dto = object1;
        } else {
            fields = fieldsObj2; principal = object2; dto = object1;
        }
        for (Field field : fields) {
            try {
                field.setAccessible(true);
                if (field.get(principal) != field.get(dto))
                    field.set(principal, field.get(dto));
                field.setAccessible(false);
            } catch (Exception e){
                System.out.println(e);
            }
        }
        return principal;
    }
}
