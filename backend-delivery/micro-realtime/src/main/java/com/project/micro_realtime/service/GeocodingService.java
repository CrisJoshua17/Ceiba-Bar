package com.project.micro_realtime.service;

import java.time.Duration;

import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.util.UriComponentsBuilder;

import com.fasterxml.jackson.databind.JsonNode;
import com.project.micro_realtime.dto.LatLng;

import lombok.extern.log4j.Log4j2;
import reactor.core.publisher.Mono;
import reactor.util.retry.Retry;

@Service
@Log4j2
public class GeocodingService {

  private final WebClient webclient;

  public GeocodingService() {
    this.webclient = WebClient.builder()
        .baseUrl("https://nominatim.openstreetmap.org")
        .defaultHeader(HttpHeaders.USER_AGENT,
            "RealtimeDeliveryApp/2.0 (+https://aunnotengo.com; cristopher_170498@hotmail.com)")
        .defaultHeader("From", " cristopher_170498@hotmail.com")
        .defaultHeader(HttpHeaders.ACCEPT, MediaType.APPLICATION_JSON_VALUE)
        .defaultHeader(HttpHeaders.ACCEPT_LANGUAGE, "es-MX,es;q=0.9")
        .build();
  }

  public Mono<LatLng> geocode(String address) {
    if (address == null || address.trim().isEmpty()) {
      return Mono.empty();
    }
    String normalizedAddress = address.trim();
    String searchQuery = buildOptimizedSearchQuery(normalizedAddress);

    // Construimos la URL correctamente con encoding seguro
    String url = UriComponentsBuilder.fromPath("/search")
        .queryParam("format", "json")
        .queryParam("q", searchQuery)
        .queryParam("limit", 1)
        .queryParam("countrycodes", "mx")
        .queryParam("addressdetails", 1)
        .build()
        .toString();

    log.info("🔍 Consultando Nominatim: https://nominatim.openstreetmap.org{}", url);

    return webclient.get()
        .uri(url)
        .retrieve()
        .bodyToMono(JsonNode.class)
        .doOnNext(jsonResponse -> {
          log.info("📡 Respuesta recibida - Es array: {}, Tamaño: {}",
              jsonResponse.isArray(), jsonResponse.size());
        })
        .timeout(Duration.ofSeconds(15))
        .retryWhen(Retry.fixedDelay(2, Duration.ofSeconds(2)))
        .flatMap(this::extractCoordinatesFromJsonNode)
        .doOnSuccess(coords -> {
          if (coords != null) {
            log.info("Geocoding EXITOSO: '{}': {}", address, coords.lat(), coords.lng());
          } else {
            log.warn("No se pudieron extraer coordenadas para: {}", address);
          }
        })
        .doOnError(error -> {
          log.error("Error en geocoding para '{}': {}", address, error.getMessage());
        })
        .onErrorResume(e -> {
          log.warn("Usando coordenadas por defecto para: {}", address);
          return Mono.empty();
        });

  }

  private String buildOptimizedSearchQuery(String address) {
    String lowerAddress = address.toLowerCase();
    String[] cdmxIndicators = { "cdmx", "ciudad de méxico", "ciudad de mexico", "mexico city", "df", "distrito federal",
        "alcaldía", "alcaldia" };

    for (String indicator : cdmxIndicators) {
      if (lowerAddress.contains(indicator)) {
        log.info("Direccion ya contiene CDMX: {}", address);
        return address;
      }
    }
    log.info("Añadiendo contexto CDMX a : {}", address);
    return address;
  }

  private Mono<LatLng> extractCoordinatesFromJsonNode(JsonNode root) {
    try {
      if (root.isArray() && root.size() > 0) {
        JsonNode firstResult = root.get(0);
        if (firstResult.has("lat") && firstResult.has("lon")) {
          double lat = firstResult.get("lat").asDouble();
          double lng = firstResult.get("lon").asDouble();
          log.info("Coordenadas extraidas: ({}, {})", lat, lng);
          return Mono.just(new LatLng(lat, lng));
        } else {
          log.warn("No se encontraron campos lat/lon en el resultado");
        }
      } else {
        log.warn("Array vacio - no se encontraron resultados");
      }
      return Mono.empty();
    } catch (Exception e) {
      log.error("Error procesando JSON: {}", e.getMessage());
      return Mono.empty();
    }

  }

}
