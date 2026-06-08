package com.example.B2BProyect.service.integration;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.json.JSONObject;

import java.time.Duration;
import java.util.List;

@Slf4j
@Service
public class SistemaA {

    @Value("${sistemaB2B.url-base}")
    private String urlBase;

    @Value("${sistemaB2B.connect-timeout:10000}")
    private int connectTimeout;

    @Value("${sistemaB2B.read-timeout:40000}")
    private int readTimeout;

    public Sistema1AuthResponse auth(Sistema1AuthRequest request) throws Exception {

        JSONObject jsonObject = new JSONObject();
        jsonObject.put("email", request.getEmail()); // Assuming getEmail() exists
        jsonObject.put("password", request.getPasswordHash());

        RestClient restClient = create();

        ResponseEntity<Sistema1AuthResponse> response;
        try {
            response = restClient.post()
                    .uri(urlBase + "/api/v1/auth/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .accept(MediaType.APPLICATION_JSON)
//                    .body(request)
                    .body(jsonObject.toString())
                    .retrieve()
                    .toEntity(Sistema1AuthResponse.class);
        } catch (Exception e) {
            log.error("Error calling auth on Sistema1. ", e);
            throw e;
        }

        if (!response.getStatusCode().is2xxSuccessful()) {
            log.error("Auth failed with status: {}", response.getStatusCode().value());
            throw new Exception("Auth failed on Sistema1");
        }

        return response.getBody();
    }


    public <T> List<T> getAll(String path, ParameterizedTypeReference<List<T>> responseType) throws Exception {
        String token = fetchToken();
        RestClient restClient = create();

        ResponseEntity<List<T>> response;
        try {
            response = restClient.get()
                    .uri(urlBase + path)
                    .header("Authorization", "Bearer " + token)
                    .accept(MediaType.APPLICATION_JSON)
                    .retrieve()
                    .toEntity(responseType);
        } catch (Exception e) {
            log.error("Error calling GET {} on Sistema1. ", path, e);
            throw e;
        }

        if (!response.getStatusCode().is2xxSuccessful()) {
            log.error("GET {} failed with status: {}", path, response.getStatusCode().value());
            throw new Exception("GET failed on Sistema1: " + path);
        }

        List<T> body = response.getBody();
        log.info("Sistema1 GET {} response: {}", path, body);
        return body;
    }


    @Value("${sistema1.auth.email}")
    private String authEmail;

    @Value("${sistema1.auth.password}")
    private String authPassword;

    private String fetchToken() throws Exception {
        Sistema1AuthRequest req = new Sistema1AuthRequest(authEmail, authPassword);
        Sistema1AuthResponse res = auth(req);
        log.info("Sistema1 JWT obtained: {}", res.getAccessToken());
        JSONObject jsonObject = new JSONObject();
        log.info("Sistema1 JWT MANUALLY obtained: {}", jsonObject.getString("access_token"));
        return res.getAccessToken();
    }


    private RestClient create() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(Duration.ofMillis(connectTimeout));
        factory.setReadTimeout(Duration.ofMillis(readTimeout));
        return RestClient.builder().requestFactory(factory).build();
    }
}
