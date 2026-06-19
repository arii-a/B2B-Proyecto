package com.example.B2BProyect.integracion.totp;

import com.example.B2BProyect.repository.UsuarioRepository;
import com.example.B2BProyect.repository.entity.Usuario;
import dev.samstevens.totp.code.CodeVerifier;
import dev.samstevens.totp.code.HashingAlgorithm;
import dev.samstevens.totp.exceptions.QrGenerationException;
import dev.samstevens.totp.qr.QrData;
import dev.samstevens.totp.qr.QrGenerator;
import dev.samstevens.totp.qr.ZxingPngQrGenerator;
import dev.samstevens.totp.secret.SecretGenerator;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Base64;

@Slf4j
@Service
@RequiredArgsConstructor
public class TotpService {
    private final SecretGenerator secretGenerator;
    private final CodeVerifier codeVerifier;
    private final EncryptionService encryptionService;
    private final UsuarioRepository userRepository;

    public String generateSecretForUser(Usuario user) {
        String rawSecret = secretGenerator.generate();
        log.info("Secret: " +rawSecret );
        String encryptedSecret = encryptionService.encrypt(rawSecret);
        log.info("Encrypted: " + encryptedSecret);
        user.setTotpSecret(encryptedSecret);
        userRepository.save(user);
        return rawSecret;
    }

    public boolean verifyCode(Usuario user, String code) {
        String rawSecret = encryptionService.decrypt(user.getTotpSecret());
        return codeVerifier.isValidCode(rawSecret, code); // ← String, no int
    }

    public String getQrUrl(String rawSecret, String userEmail, String issuer)
            throws QrGenerationException {
        QrData data = new QrData.Builder()
                .label(userEmail)
                .secret(rawSecret)
                .issuer(issuer)
                .algorithm(HashingAlgorithm.SHA1)
                .digits(6)
                .period(30)
                .build();

        QrGenerator generator = new ZxingPngQrGenerator();
        byte[] imageData = generator.generate(data);
        return "data:image/png;base64," + Base64.getEncoder().encodeToString(imageData);
    }

}
