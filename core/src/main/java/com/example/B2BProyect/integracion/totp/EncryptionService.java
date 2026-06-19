package com.example.B2BProyect.integracion.totp;

import org.jasypt.encryption.StringEncryptor;
import org.springframework.stereotype.Service;

@Service
public class EncryptionService {
    private final StringEncryptor encryptor;

    public EncryptionService(StringEncryptor encryptor) {
        this.encryptor = encryptor;
    }

    public String encrypt(String value) {
        return encryptor.encrypt(value);
    }

    public String decrypt(String encryptedValue) {
        return encryptor.decrypt(encryptedValue);
    }
}
