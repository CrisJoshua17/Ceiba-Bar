package com.project.micro_realtime.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.project.micro_realtime.model.OrderTracking;
import com.project.micro_realtime.repository.TrackingRepository;

import lombok.RequiredArgsConstructor;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/api/tracking")
@RequiredArgsConstructor
public class TrackingController {

    private final TrackingRepository trackingRepository;

    @GetMapping("/{orderId}")
    public Flux<OrderTracking> getTracking(@PathVariable Long orderId) {
        return trackingRepository.findByOrderIdOrderByTimestampAsc(orderId);
    }

    @GetMapping("/{orderId}/latest")
    public Mono<OrderTracking> getLatestTracking(@PathVariable Long orderId) {
        return trackingRepository.findTopByOrderIdOrderByTimestampDesc(orderId)
                .switchIfEmpty(Mono.empty());
    }
}
