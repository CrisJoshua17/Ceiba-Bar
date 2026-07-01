package com.project.micro_drivers.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.project.micro_drivers.model.Driver;
import com.project.micro_drivers.model.PendingAssignment;
import com.project.micro_drivers.model.OutboxEvent;
import com.project.micro_drivers.model.OutboxStatus;
import com.project.micro_drivers.repository.DriverRepository;
import com.project.micro_drivers.repository.PendingAssignmentRepository;
import com.project.micro_drivers.repository.OutboxRepository;

import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class DriverServiceImpl implements DriverService {

    private final DriverRepository repository;
    private final PendingAssignmentRepository pendingAssignmentRepository;
    private final OutboxRepository outboxRepository;
    private final DriverAssignmentStrategy driverAssignmentStrategy;
    private final com.project.micro_drivers.Feign.UserClient userClient;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public DriverServiceImpl(
            DriverRepository repository,
            PendingAssignmentRepository pendingAssignmentRepository,
            OutboxRepository outboxRepository,
            @Qualifier("nearest") DriverAssignmentStrategy driverAssignmentStrategy,
            com.project.micro_drivers.Feign.UserClient userClient) {
        this.repository = repository;
        this.pendingAssignmentRepository = pendingAssignmentRepository;
        this.outboxRepository = outboxRepository;
        this.driverAssignmentStrategy = driverAssignmentStrategy;
        this.userClient = userClient;
    }

    @Override
    public Driver createDriver(Driver driver) {
        return repository.save(driver);
    }

    @Override
    public Driver save(Driver driver) {
        return repository.save(driver);
    }

    @Override
    public Optional<Driver> findById(Long id) {
        return repository.findById(id);
    }

    @Override
    public List<Driver> findAll() {
        try {
            List<com.project.micro_drivers.model.dto.UserDto> users = userClient.findAllByRole(com.project.micro_drivers.model.dto.Role.DRIVER);
            if (users != null) {
                for (com.project.micro_drivers.model.dto.UserDto user : users) {
                    if (user.getId() != null && repository.findByUserId(user.getId()).isEmpty()) {
                        log.info("Sincronizando chofer faltante desde micro_usuarios: {}", user.getEmail());
                        Driver driver = new Driver();
                        driver.setUserId(user.getId());
                        driver.setUserEmail(user.getEmail());
                        driver.setAvailable(true);
                        driver.setRating(0.0);
                        driver.setTotalDeliveries(0);
                        driver.setRegistrationDate(LocalDateTime.now());
                        repository.save(driver);
                    }
                }
            }
        } catch (Exception e) {
            log.error("Error sincronizando drivers desde micro-usuarios: {}", e.getMessage());
        }
        return repository.findAll();
    }

    @Override
    public Driver update(Driver driver) {
        Driver driverDb = repository.findById(driver.getId())
                .orElseThrow(() -> new RuntimeException("Error al encontrar el Driver con id: " + driver.getId()));
        driverDb.setMotoId(driver.getMotoId());
        driverDb.setLicensePlate(driver.getLicensePlate());
        driverDb.setLicenseNumber(driver.getLicenseNumber());
        if (driver.getCurrentLatitude() != null) {
            driverDb.setCurrentLatitude(driver.getCurrentLatitude());
        }
        if (driver.getCurrentLongitude() != null) {
            driverDb.setCurrentLongitude(driver.getCurrentLongitude());
        }
        if (driver.getAvailable() != null) {
            driverDb.setAvailable(driver.getAvailable());
        }
        return repository.save(driverDb);
    }

    @Override
    public void delete(Long id) {
        Driver driverDb = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Error al encontrar el Driver con id: " + id));
        repository.deleteById(id);
    }

    @Override
    public Optional<Driver> findByUserId(String userId) {
        return repository.findByUserId(userId);
    }

    @Override
    public Optional<Driver> findByUserEmail(String email) {
        return repository.findByUserEmail(email);
    }

    @Override
    @Transactional
    public void assignDriverToOrder(long orderId, String messagePayload) {
        log.info("Attempting to assign driver to order id: {}", orderId);
        List<Driver> availableDrivers = repository.findByAvailableTrue();
        if (!availableDrivers.isEmpty()) {
            Driver assignedDriver = driverAssignmentStrategy.assign(availableDrivers);
            if (assignedDriver != null) {
                log.info("Assigning driver: {} (email: {}) to order id: {}", assignedDriver.getId(), assignedDriver.getUserEmail(), orderId);
                assignedDriver.setAvailable(false);
                repository.save(assignedDriver);

                try {
                    JsonNode rootNode = objectMapper.readTree(messagePayload);
                    ObjectNode payloadNode = (ObjectNode) rootNode;
                    payloadNode.put("driverId", assignedDriver.getId());
                    payloadNode.put("driverName", assignedDriver.getUserEmail());

                    OutboxEvent outboxEvent = OutboxEvent.builder()
                            .aggregateType("Order")
                            .aggregateId(orderId)
                            .eventType("DRIVER_ASSIGNED")
                            .payload(objectMapper.writeValueAsString(payloadNode))
                            .status(OutboxStatus.PENDING)
                            .createdAt(LocalDateTime.now())
                            .build();
                    outboxRepository.save(outboxEvent);
                } catch (Exception e) {
                    log.error("Error creating DRIVER_ASSIGNED outbox event", e);
                    throw new RuntimeException("Error processing payload", e);
                }
                return;
            }
        }

        // If no available drivers, save to queue
        log.warn("No available drivers for order id: {}. Enqueuing in pending_assignments.", orderId);
        if (pendingAssignmentRepository.existsByOrderId(orderId)) {
            log.info("Order id: {} is already enqueued in pending_assignments. Skipping.", orderId);
            return;
        }
        PendingAssignment pending = PendingAssignment.builder()
                .orderId(orderId)
                .payload(messagePayload)
                .createdAt(LocalDateTime.now())
                .build();
        pendingAssignmentRepository.save(pending);
    }

    @Override
    @Transactional
    public void tryAssignPendingOrders() {
        log.info("Checking for pending assignments in queue...");
        List<PendingAssignment> pendingList = pendingAssignmentRepository.findAllByOrderByCreatedAtAsc();
        if (pendingList.isEmpty()) {
            log.info("No pending assignments in queue.");
            return;
        }

        for (PendingAssignment pending : pendingList) {
            List<Driver> availableDrivers = repository.findByAvailableTrue();
            if (availableDrivers.isEmpty()) {
                log.info("No available drivers. Leaving remaining orders in queue.");
                break;
            }

            Driver assignedDriver = driverAssignmentStrategy.assign(availableDrivers);
            if (assignedDriver == null) {
                log.info("Strategy returned null driver. Leaving remaining orders in queue.");
                break;
            }

            log.info("De-queuing order id: {} and assigning driver: {} (email: {})", pending.getOrderId(), assignedDriver.getId(), assignedDriver.getUserEmail());
            assignedDriver.setAvailable(false);
            repository.save(assignedDriver);

            try {
                JsonNode rootNode = objectMapper.readTree(pending.getPayload());
                ObjectNode payloadNode = (ObjectNode) rootNode;
                payloadNode.put("driverId", assignedDriver.getId());
                payloadNode.put("driverName", assignedDriver.getUserEmail());

                OutboxEvent outboxEvent = OutboxEvent.builder()
                        .aggregateType("Order")
                        .aggregateId(pending.getOrderId())
                        .eventType("DRIVER_ASSIGNED")
                        .payload(objectMapper.writeValueAsString(payloadNode))
                        .status(OutboxStatus.PENDING)
                        .createdAt(LocalDateTime.now())
                        .build();
                outboxRepository.save(outboxEvent);
            } catch (Exception e) {
                log.error("Error creating DRIVER_ASSIGNED outbox event for queued order", e);
                throw new RuntimeException("Error processing payload", e);
            }

            pendingAssignmentRepository.delete(pending);
        }
    }

    @Override
    @Transactional
    public Driver updateLocation(Long driverId, Double latitude, Double longitude) {
        Driver driver = repository.findById(driverId)
                .orElseThrow(() -> new RuntimeException("Driver not found with id: " + driverId));
        driver.setCurrentLatitude(latitude);
        driver.setCurrentLongitude(longitude);
        Driver saved = repository.save(driver);
        log.info("Driver id: {} location updated to: ({}, {})", driverId, latitude, longitude);
        if (Boolean.TRUE.equals(saved.getAvailable())) {
            tryAssignPendingOrders();
        }
        return saved;
    }

    @Override
    @Transactional
    public Driver updateAvailability(Long driverId, Boolean available) {
        Driver driver = repository.findById(driverId)
                .orElseThrow(() -> new RuntimeException("Driver not found with id: " + driverId));
        driver.setAvailable(available);
        Driver saved = repository.save(driver);
        log.info("Driver id: {} availability updated to: {}", driverId, available);
        if (Boolean.TRUE.equals(available)) {
            tryAssignPendingOrders();
        }
        return saved;
    }

    @Override
    public List<Driver> findAvailableDrivers() {
        return repository.findByAvailableTrue();
    }
}
