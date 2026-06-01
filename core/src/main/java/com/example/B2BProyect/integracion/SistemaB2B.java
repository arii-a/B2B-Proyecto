package com.example.B2BProyect.integracion;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.time.Duration;
import java.util.List;

@Slf4j
@Service
public class SistemaB2B {

    @Value("${b2b.url-base}")
    private String urlBase;

    @Value("${stereum.url-base}")
    private String stereumUrl;

    @Value("${b2b.connect-timeout:10000}")
    private int connectTimeout;

    @Value("${b2b.read-timeout:40000}")
    private int readTimeout;

    @Value("${stereum.api-key}")
    private String stereumToken;

    private String token;


    public B2BAuthResponse auth(B2BAuthRequest request) throws Exception {
        RestClient restClient = create();

        ResponseEntity<B2BAuthResponse> response;
        try {
            response = restClient.post()
                    .uri(urlBase + "/api/v1/auth")
                    .contentType(MediaType.APPLICATION_JSON)
                    .accept(MediaType.APPLICATION_JSON)
                    .body(request)
                    .retrieve()
                    .toEntity(B2BAuthResponse.class);
        } catch (Exception e) {
            log.error("Error calling B2B auth. ", e);
            throw e;
        }

        if (!response.getStatusCode().is2xxSuccessful()) {
            log.error("B2B auth failed with status: {}", response.getStatusCode().value());
            throw new Exception("B2B auth failed");
        }

        assert response.getBody() != null;
        token = response.getBody().getAccessToken();
        log.info("B2B JWT obtained: {}", token);
        return response.getBody();
    }

    public StereuemApiResponse callStereum(StereumApiRequest request) throws Exception {
        RestClient restClient = create();

        ResponseEntity<StereuemApiResponse> response;
        try {
            response = restClient.post()
                    .uri(stereumUrl + "/api/v1/transactions/create-charge")
                    .contentType(MediaType.APPLICATION_JSON)
                    .accept(MediaType.APPLICATION_JSON)
                    .header("x-api-key", stereumToken)
                    .body(request)
                    .retrieve()
                    .toEntity(StereuemApiResponse.class);
        } catch (Exception e) {
            log.error("Error calling Stereum API. ", e);
            throw e;
        }

        if (!response.getStatusCode().is2xxSuccessful()) {
            log.error("Stereum API failed with status: {}", response.getStatusCode().value());
            throw new Exception("Stereum API call failed");
        }

        log.info("Stereum response: {}", response.getBody());
        return response.getBody();
    }

    public List<B2BEmpresasResponse> listCategorias() throws Exception {
        RestClient restClient = create();
        try {
            return restClient.get()
                    .uri(urlBase + "/api/v1/empresas")
                    .accept(MediaType.APPLICATION_JSON)
                    .header("Authorization", "Bearer " + token)
                    .retrieve()
                    .body(new ParameterizedTypeReference<>() {});
        } catch (Exception e) {
            log.error("Error calling B2B /empresas. ", e);
            throw e;
        }
    }

    public UsersMeResponse list2() throws Exception {
        RestClient restClient = create();
        try {
            return restClient.get()
                    .uri(urlBase + "/api/v1/users/me")
                    .accept(MediaType.APPLICATION_JSON)
                    .header("Authorization", "Bearer " + token)
                    .retrieve()
                    .body(new ParameterizedTypeReference<>() {});
        } catch (Exception e) {
            log.error("Error calling B2B /users/me. ", e);
            throw e;
        }
    }

    public StereumQuoteResponse createQuote(StereumQuoteRequest request) throws Exception {
        RestClient restClient = create();

        ResponseEntity<StereumQuoteResponse> response;
        try {
            response = restClient.post()
                    .uri(stereumUrl + "/api/v1/otc/quotes")
                    .contentType(MediaType.APPLICATION_JSON)
                    .accept(MediaType.APPLICATION_JSON)
                    .header("x-api-key", stereumToken)
                    .body(request)
                    .retrieve()
                    .toEntity(StereumQuoteResponse.class);
        } catch (Exception e) {
            log.error("Error calling Stereum createQuote. ", e);
            throw e;
        }

        if (!response.getStatusCode().is2xxSuccessful()) {
            log.error("Stereum createQuote failed with status: {}", response.getStatusCode().value());
            throw new Exception("Stereum createQuote failed");
        }

        log.info("Stereum quote response: {}", response.getBody());
        return response.getBody();
    }

    public List<StereumBankResponse> listBanks(String country) throws Exception {
        RestClient restClient = create();
        try {
            List<StereumBankResponse> banks = restClient.get()
                    .uri(stereumUrl + "/api/v1/banks?country=" + country)
                    .accept(MediaType.APPLICATION_JSON)
                    .header("x-api-key", stereumToken)
                    .retrieve()
                    .body(new ParameterizedTypeReference<>() {});
            log.info("Stereum banks for {}: {}", country, banks);
            return banks;
        } catch (Exception e) {
            log.error("Error calling Stereum listBanks. ", e);
            throw e;
        }
    }

    private RestClient create() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(Duration.ofMillis(connectTimeout));
        factory.setReadTimeout(Duration.ofMillis(readTimeout));
        return RestClient.builder().requestFactory(factory).build();
    }
}
