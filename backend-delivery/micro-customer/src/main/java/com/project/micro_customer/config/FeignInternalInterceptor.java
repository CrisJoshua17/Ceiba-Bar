package com.project.micro_customer.config;

import feign.RequestInterceptor;
import feign.RequestTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class FeignInternalInterceptor implements RequestInterceptor {

    @Value("${internal.api-key:ceiba-bar-internal-secret-2026}")
    private String internalApiKey;

    @Override
    public void apply(RequestTemplate template) {
        // Solo añadir header para rutas internas
        if (template.url().contains("/internal/")) {
            template.header("X-Internal-Api-Key", internalApiKey);
        }
    }
}
