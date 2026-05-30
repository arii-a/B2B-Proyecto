package com.example.B2BProyect.integracion;

import com.example.B2BProyect.service.exception.NotDataFoundException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;
import java.util.List;

@Slf4j
@Service
public class SistemaB2B {
    @Value("${b2b.url-base}")
    private String urlBase;
    @Value("${stereum.url-base}")
    private String stereumUrl;
    @Value("${b2b.connect-timeout}")
    private int connectTimeout = 10000;
    @Value("${b2b.read-timeout}")
    private int readTimeout = 40000;
    @Value("${stereum.apikey}")
    private String stereumToken;
    private String token;


    public B2BAuthResponse auth(B2BAuthRequest request) throws Exception {
        RestClient restClient = create();

        ResponseEntity<B2BAuthResponse> response;
        try {
            response = restClient.post()
                    .uri(urlBase + "/api/v1/auth")
                    .header("Content-Type", MediaType.APPLICATION_JSON_VALUE)
                    .header("Accept", MediaType.APPLICATION_JSON_VALUE)
                    .body(request)
                    .retrieve()
                    .toEntity(B2BAuthResponse.class);
        } catch (NotDataFoundException e) {
            log.error("NotDataFoundException. {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("Exception. ", e);
            throw e;
        }

        if (!response.getStatusCode().is2xxSuccessful()) {
            log.error("Se genero error: {}", response.getStatusCode().value());
            throw new Exception("Se genero error");
        }
        assert response.getBody() != null;
        token = response.getBody().getAccessToken();
        return response.getBody();
    }

    public StereuemApiResponse callStereum(StereumApiRequest request) throws Exception {
        RestClient restClient = create();

        ResponseEntity<StereuemApiResponse> response;
        try {
            response = restClient.post()
                    .uri(stereumUrl + "/api/v1/transactions/create-charge")
                    .header("Content-Type", MediaType.APPLICATION_JSON_VALUE)
                    .header("Accept", MediaType.APPLICATION_JSON_VALUE)
                    .header("x-api-key", stereumToken)
                    .body(request)
                    .retrieve()
                    .toEntity(StereuemApiResponse.class);
        } catch (NotDataFoundException e) {
            log.error("NotDataFoundException. {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("Exception. ", e);
            throw e;
        }

        if (!response.getStatusCode().is2xxSuccessful()) {
            log.error("Se genero error: {}", response.getStatusCode().value());
            throw new Exception("Se genero error");
        }
        return response.getBody();
    }

    public List<B2BEmpresasResponse> listCategorias() throws Exception {
        RestClient restClient = create();

        List<B2BEmpresasResponse> response;
        try {
            response = restClient.get()
                    .uri(urlBase + "/api/v1/empresas")
                    .header("Accept", MediaType.APPLICATION_JSON_VALUE)
                    .header("Authorization", "Bearer "+ token)
                    .retrieve()
                    .body(new ParameterizedTypeReference<List<B2BEmpresasResponse>>() {});
        } catch (NotDataFoundException e) {
            log.error("NotDataFoundException. {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("Exception. ", e);
            throw e;
        }

//        if (!response.getStatusCode().is2xxSuccessful()) {
//            log.error("Se genero error: {}", response.getStatusCode().value());
//            throw new Exception("Se genero error");
//        }

        return response;
    }


    public UsersMeResponse list2() throws Exception {
        RestClient restClient = create();

        UsersMeResponse response;
        try {
            response = restClient.get()
                    .uri(urlBase + "/api/v1/users/me")
                    .header("Accept", MediaType.APPLICATION_JSON_VALUE)
                    .header("Authorization", "Bearer "+ token)
                    .retrieve()
                    .body(new ParameterizedTypeReference<UsersMeResponse>() {});
        } catch (NotDataFoundException e) {
            log.error("NotDataFoundException. {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("Exception. ", e);
            throw e;
        }

//        if (!response.getStatusCode().is2xxSuccessful()) {
//            log.error("Se genero error: {}", response.getStatusCode().value());
//            throw new Exception("Se genero error");
//        }

        return response;
    }

    private RestClient create() {
        SimpleClientHttpRequestFactory clientHttpRequestFactory = new SimpleClientHttpRequestFactory();
        clientHttpRequestFactory.setConnectTimeout(Duration.ofMillis(connectTimeout));
        clientHttpRequestFactory.setReadTimeout(Duration.ofMillis(readTimeout));

        return RestClient.builder().requestFactory(clientHttpRequestFactory).build();
    }
}
