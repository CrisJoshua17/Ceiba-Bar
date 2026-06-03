# 🚀 PLAN MAESTRO — Ceiba-Bar Delivery (v2)

---

## 📌 CONTEXTO DEL PROYECTO (Léelo primero)

**Nombre:** Ceiba-Bar Delivery
**Descripción:** Plataforma de delivery para un bar/restaurante. Los clientes hacen pedidos desde la web, se les asigna un conductor que entrega el pedido, y pueden rastrear la entrega en tiempo real.

**Estado actual:** Existe un borrador funcional (v1) con microservicios básicos. Se está reescribiendo desde cero en una **rama v2** de Git con arquitectura profesional, patrones de diseño, seguridad y buenas prácticas.

### Stack Tecnológico

**Backend:**
- Java 21 + Spring Boot 3 + Spring Cloud
- Arquitectura de microservicios con Eureka (Service Discovery) + Spring Cloud Gateway
- Bases de datos: PostgreSQL (datos transaccionales) + MongoDB (tracking/eventos)
- Mensajería: RabbitMQ (comunicación entre servicios) + Kafka (streaming en tiempo real)
- Caché: Redis
- Auth: Keycloak (OAuth2/OIDC, login con Google)
- Pagos: Stripe + PayPal (patrón Strategy)

**Frontend (dos versiones):**
- **Angular 19** (PrimeNG, Leaflet para mapas, Tailwind CSS)
- **React 19 + Next.js 15** (App Router, Zustand, TanStack Query, Shadcn/ui, Leaflet)

> 💡 Se eligió Next.js sobre Vite para la versión React por las ventajas de SSR/SEO, API Routes,
> middleware integrado y optimización de imágenes. Ideal para mostrar en CV/portafolio.

**Infraestructura:**
- Todo dockerizado con Docker Compose (Multi-Stage builds)
- Nginx como reverse proxy + SSL (Let's Encrypt)
- Orquestación con Kubernetes (Minikube para local)
- Deploy en Hetzner VPS / AWS EC2 / Azure VM
- CI/CD con GitHub Actions

### Microservicios

| Servicio | Responsabilidad | BD | Patrones clave |
|---|---|---|---|
| `micro-gateway` | Punto de entrada, seguridad, rate limiting | — | API Gateway, Chain of Responsibility, Circuit Breaker |
| `eureka` | Service Discovery | — | Service Registry |
| Keycloak | Autenticación, OAuth2, login social | Postgres | Identity Brokering, Strangler Fig (migra micro-auth) |
| `micro-customer` | Gestión de clientes y direcciones | Postgres | Repository, DTO/Mapper, Specification |
| `micro-drivers` | Gestión de conductores y geolocalización | Postgres | Repository, DTO/Mapper, Strategy (asignación) |
| `micro-productos` | Catálogo de productos/menú | Postgres | Repository, Decorator (caché), Builder |
| `micro-payments` | Cobros Stripe + PayPal, reembolsos | Postgres | **Strategy**, Adapter, Observer |
| `micro-realtime` | Órdenes, tracking GPS, WebSockets | Postgres + MongoDB | **State**, CQRS, Event Sourcing, Saga |
| `micro-notifications` | Emails, push, SMS | MongoDB | **Factory**, Adapter, Observer |

### Decisiones tomadas

1. **Mapas:** Usar Leaflet + OpenStreetMap (100% gratis). Google Maps descartado por costos.
2. **Auth:** Keycloak reemplaza el micro-auth manual. Login con Google vía Identity Brokering.
3. **Pagos:** Stripe + PayPal con patrón Strategy. Webhooks para confirmar cobros.
4. **Mensajería:** RabbitMQ para lógica de negocio + Kafka para streaming de alto volumen.
5. **Tokens JWT:** RS256, Access Token 5-15 min, Refresh Token con rotación, almacenar en memoria JS.
6. **Git:** Código actual tageado como v1.0. Todo el trabajo nuevo en rama v2.
7. **Deploy:** Hetzner VPS como opción principal (mejor precio/rendimiento). AWS/Azure como alternativas.
8. **Frontend React:** Next.js 15 con App Router (SSR, SEO, middleware) en lugar de Vite (SPA).
9. **Orquestación:** Docker Compose para desarrollo/staging → Kubernetes (Minikube) para aprender → K8s en producción.

### Cómo usar este archivo

- **Si estás en un chat nuevo:** Pega este archivo completo como contexto. El asistente entenderá todo el proyecto.
- **Si necesitas ayuda con un punto:** Indica el número de sección (ej: "Ayúdame con 1.2 Pasarelas de Pago").
- **Para marcar progreso:** Cambia ⬜ por 🔧 (en progreso) o ✅ (hecho).

---

> Prioridades: 🔴 Alta | 🟡 Media | 🟢 Baja
> Estado: ⬜ Pendiente | 🔧 En progreso | ✅ Hecho

---

## ⚙️ 1. BACKEND (Spring Boot Microservicios)

### 1.1 Identidad y Autenticación — Keycloak 🔴

- ⬜ Reemplazar `micro-auth` por un contenedor de **Keycloak** (migración gradual con **Strangler Fig Pattern**).
- ⬜ Habilitar **Identity Brokering** (Login con Google, Facebook, Apple).
- ⬜ Configurar Gateway y microservicios como **OAuth2 Resource Servers** (`spring-boot-starter-oauth2-resource-server`).
- ⬜ Definir **Realms, Clients y Roles** en Keycloak (ADMIN, CUSTOMER, DRIVER, RESTAURANT).
- ⬜ Implementar **Refresh Token Rotation** para evitar robo de sesión.
- ⬜ Exportar realm config a JSON para versionado en Git (reproducible en cualquier entorno).

### 1.2 Pasarelas de Pago — Stripe + PayPal 🔴

- ⬜ Implementar **patrón Strategy** en `micro_payments`: interfaz `PaymentGateway` con `StripeGateway` y `PayPalGateway`.
- ⬜ Configurar **Webhooks** de ambos proveedores. La orden pasa a "PAGADA" solo cuando el webhook confirma el cobro.
- ⬜ Implementar **idempotency keys** para evitar cobros duplicados.
- ⬜ Manejar reembolsos parciales y totales desde el backend.
- ⬜ Agregar campos `refundAmount`, `refundReason` y `refundedAt` a la entidad `Payment`.

```java
// --- PATRÓN STRATEGY (micro_payments) ---
public interface PaymentGateway {
    PaymentResult processPayment(PaymentRequest request);
    RefundResult processRefund(RefundRequest request); // Soporta reembolsos parciales
}

@Component("stripe")
public class StripeGateway implements PaymentGateway { /* ... */ }

@Component("paypal")
public class PayPalGateway implements PaymentGateway { /* ... */ }

@Service
public class PaymentService {
    private final Map<String, PaymentGateway> gateways;
    public PaymentService(Map<String, PaymentGateway> gateways) {
        this.gateways = gateways; // Spring inyecta ambas por nombre
    }
    public PaymentResult pay(String method, PaymentRequest req) {
        return gateways.get(method).processPayment(req);
    }
}
```

### 1.3 Mensajería — RabbitMQ + Kafka 🔴

- ⬜ **RabbitMQ**: Para comunicación entre microservicios (pagos → órdenes, notificaciones).
- ⬜ **Kafka**: Mantenerlo para event streaming de alto volumen (tracking GPS en tiempo real).
- ⬜ Implementar **Patrón Saga por Coreografía** para transacciones distribuidas.
- ⬜ Implementar **Patrón Outbox** con polling para garantizar consistencia eventual.
- ⬜ Implementar **Dead Letter Queues (DLQ)** para mensajes que fallan repetidamente.
- ⬜ Implementar **retry con backoff exponencial** en consumers para tolerancia a fallos transitorios.

#### 1.3.1 Saga por Coreografía — Flujo completo de un pedido

> En la Saga por **coreografía**, NO hay un orquestador central. Cada servicio escucha eventos,
> hace su trabajo, y publica el siguiente evento. Si algo falla, publica un evento de compensación.

```
Flujo exitoso (happy path):
═══════════════════════════════════════════════════════════════════════

  micro-realtime          micro-productos       micro-payments        micro-drivers
       │                        │                     │                     │
  ┌────┴────┐                   │                     │                     │
  │ Cliente │                   │                     │                     │
  │ crea    │──ORDEN_CREADA────▶│                     │                     │
  │ orden   │                   │                     │                     │
  └────┬────┘              ┌────┴────┐                │                     │
       │                   │Reservar │                │                     │
       │                   │ stock   │─STOCK_RESERVED─▶│                     │
       │                   └────┬────┘                │                     │
       │                        │                ┌────┴────┐                │
       │                        │                │ Cobrar  │                │
       │                        │                │ pago    │─PAYMENT_OK────▶│
       │                        │                └────┬────┘                │
       │                        │                     │               ┌────┴────┐
       │                        │                     │               │Asignar  │
  ◀────DRIVER_ASSIGNED──────────┼─────────────────────┼───────────────│conduc.  │
       │                        │                     │               └─────────┘
  ┌────┴────┐                   │                     │                     │
  │Actualiz.│                   │                     │                     │
  │estado a │                   │                     │                     │
  │ASSIGNED │                   │                     │                     │
  └─────────┘                   │                     │                     │

Flujo con fallo en pago (compensación):
═══════════════════════════════════════════════════════════════════════

  micro-realtime          micro-productos       micro-payments
       │                        │                     │
  ORDEN_CREADA─────────────────▶│                     │
       │                   Reservar stock             │
       │                   STOCK_RESERVED────────────▶│
       │                        │                Cobrar pago
       │                        │                ❌ FALLO
       │                        │                PAYMENT_FAILED──▶│
       │                   ◀──PAYMENT_FAILED          │
       │                   Liberar stock              │
       │                   STOCK_RELEASED             │
  ◀──PAYMENT_FAILED             │                     │
  Marcar orden                  │                     │
  como CANCELLED                │                     │
```

#### 1.3.2 Outbox Pattern — Garantizar que los eventos SIEMPRE se publiquen

> **Problema:** Si el servicio guarda en BD pero se cae ANTES de publicar el evento en RabbitMQ,
> se pierde el evento y el flujo Saga se rompe. El Outbox Pattern resuelve esto.

> **Solución:** En vez de publicar directo a RabbitMQ, se guarda el evento en una tabla `outbox`
> dentro de la MISMA transacción que el cambio de negocio. Un poller lee la tabla y publica.

```java
// --- ENTIDAD OUTBOX (en cada microservicio que publique eventos) ---
@Entity
@Table(name = "outbox_events")
public class OutboxEvent {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String aggregateType;   // "Order", "Payment", "Product"
    private Long aggregateId;       // ID de la entidad afectada
    private String eventType;       // "ORDEN_CREADA", "PAGO_EXITOSO", etc.

    @Column(columnDefinition = "TEXT")
    private String payload;         // JSON del evento

    @Enumerated(EnumType.STRING)
    private OutboxStatus status;    // PENDING, SENT, FAILED

    private LocalDateTime createdAt;
    private LocalDateTime sentAt;
    private Integer retryCount = 0;
}

public enum OutboxStatus { PENDING, SENT, FAILED }
```

```java
// --- SERVICIO: Guardar negocio + outbox en MISMA transacción ---
@Service
public class OrderService {
    private final OrderRepository orderRepo;
    private final OutboxRepository outboxRepo;

    @Transactional  // ← Misma transacción para ambos
    public Order createOrder(OrderRequest request) {
        // 1. Guardar la orden en BD
        Order order = orderRepo.save(buildOrder(request));

        // 2. Guardar evento en tabla outbox (misma transacción)
        OutboxEvent event = OutboxEvent.builder()
            .aggregateType("Order")
            .aggregateId(order.getId())
            .eventType("ORDEN_CREADA")
            .payload(toJson(new OrderCreatedEvent(order)))
            .status(OutboxStatus.PENDING)
            .createdAt(LocalDateTime.now())
            .build();
        outboxRepo.save(event);

        return order;
        // Si la transacción falla, AMBOS se hacen rollback.
        // Si la transacción pasa, el evento SIEMPRE estará en la tabla.
    }
}
```

```java
// --- POLLER: Lee la tabla outbox y publica a RabbitMQ ---
@Component
public class OutboxPoller {
    private final OutboxRepository outboxRepo;
    private final RabbitTemplate rabbitTemplate;

    @Scheduled(fixedDelay = 1000)  // Cada 1 segundo
    @Transactional
    public void pollAndPublish() {
        List<OutboxEvent> pending = outboxRepo
            .findByStatusOrderByCreatedAtAsc(OutboxStatus.PENDING);

        for (OutboxEvent event : pending) {
            try {
                // Publicar a RabbitMQ
                rabbitTemplate.convertAndSend(
                    "exchange.saga",           // Exchange
                    event.getEventType(),       // Routing key
                    event.getPayload()          // Mensaje
                );

                // Marcar como enviado
                event.setStatus(OutboxStatus.SENT);
                event.setSentAt(LocalDateTime.now());
            } catch (Exception e) {
                event.setRetryCount(event.getRetryCount() + 1);
                if (event.getRetryCount() >= 5) {
                    event.setStatus(OutboxStatus.FAILED); // Va a DLQ manual
                }
            }
            outboxRepo.save(event);
        }
    }
}
```

```java
// --- LISTENER en micro-productos (Saga coreografía) ---
@Component
public class ProductSagaListener {
    private final ProductService productService;
    private final StockReservationRepository reservationRepo;
    private final OutboxRepository outboxRepo;

    @RabbitListener(queues = "queue.order.created")
    @Transactional
    public void onOrderCreated(String payload) {
        OrderCreatedEvent event = fromJson(payload, OrderCreatedEvent.class);

        try {
            // Reservar stock para cada item
            for (var item : event.getItems()) {
                productService.reserveStock(item.getProductId(), item.getQuantity());
                reservationRepo.save(StockReservation.builder()
                    .orderId(event.getOrderId())
                    .productId(item.getProductId())
                    .quantity(item.getQuantity())
                    .status(ReservationStatus.RESERVED)
                    .expiresAt(LocalDateTime.now().plusMinutes(15))
                    .build());
            }

            // Publicar éxito via Outbox
            outboxRepo.save(OutboxEvent.builder()
                .aggregateType("Product")
                .aggregateId(event.getOrderId())
                .eventType("STOCK_RESERVED")
                .payload(toJson(new StockReservedEvent(event.getOrderId())))
                .status(OutboxStatus.PENDING)
                .createdAt(LocalDateTime.now())
                .build());

        } catch (InsufficientStockException e) {
            // Publicar fallo via Outbox (compensación)
            outboxRepo.save(OutboxEvent.builder()
                .aggregateType("Product")
                .aggregateId(event.getOrderId())
                .eventType("STOCK_RESERVATION_FAILED")
                .payload(toJson(new StockFailedEvent(event.getOrderId(), e.getMessage())))
                .status(OutboxStatus.PENDING)
                .createdAt(LocalDateTime.now())
                .build());
        }
    }

    @RabbitListener(queues = "queue.payment.failed")
    @Transactional
    public void onPaymentFailed(String payload) {
        PaymentFailedEvent event = fromJson(payload, PaymentFailedEvent.class);

        // Compensación: liberar stock reservado
        List<StockReservation> reservations = reservationRepo
            .findByOrderIdAndStatus(event.getOrderId(), ReservationStatus.RESERVED);

        for (var reservation : reservations) {
            productService.releaseStock(reservation.getProductId(), reservation.getQuantity());
            reservation.setStatus(ReservationStatus.RELEASED);
            reservationRepo.save(reservation);
        }

        outboxRepo.save(OutboxEvent.builder()
            .aggregateType("Product")
            .aggregateId(event.getOrderId())
            .eventType("STOCK_RELEASED")
            .payload(toJson(new StockReleasedEvent(event.getOrderId())))
            .status(OutboxStatus.PENDING)
            .createdAt(LocalDateTime.now())
            .build());
    }
}
```

```
RabbitMQ — Exchanges y Queues para la Saga:
═══════════════════════════════════════════════════════════════

Exchange: exchange.saga (tipo: topic)

  Routing Key                  → Queue                        → Consumer
  ─────────────────────────────────────────────────────────────────────────
  ORDEN_CREADA                 → queue.order.created           → micro-productos
  STOCK_RESERVED               → queue.stock.reserved          → micro-payments
  STOCK_RESERVATION_FAILED     → queue.stock.failed            → micro-realtime
  PAYMENT_OK                   → queue.payment.ok              → micro-drivers
  PAYMENT_FAILED               → queue.payment.failed          → micro-productos, micro-realtime
  DRIVER_ASSIGNED              → queue.driver.assigned         → micro-realtime
  DRIVER_NOT_AVAILABLE         → queue.driver.unavailable      → micro-payments (reembolso)

Dead Letter Exchange: exchange.saga.dlx
  → queue.saga.dlq (todos los mensajes que fallan 3+ veces)
```

### 1.4 Resiliencia 🟡

- ⬜ **Resilience4j** en el API Gateway: Circuit Breaker, Retry, Rate Limiter, Bulkhead.
- ⬜ **Timeouts** configurados en todas las llamadas HTTP entre servicios (máx. 3-5 segundos).
- ⬜ **Fallback responses** cuando un servicio esté caído.
- ⬜ **Health Check endpoints** personalizados que verifiquen dependencias (BD, Redis, RabbitMQ).

### 1.5 Caché — Redis 🟡

- ⬜ Agregar **Redis** al docker-compose.
- ⬜ Cachear: catálogo de productos, menús, configuraciones, sesiones de Keycloak.
- ⬜ Usar `@Cacheable` de Spring o RedisTemplate.
- ⬜ Implementar **cache invalidation** por eventos Kafka/RabbitMQ cuando un producto cambie.
- ⬜ Usar Redis para **distributed locking** (ej: evitar doble asignación de conductor).

### 1.6 Base de Datos — Migraciones, Entidades y Mejoras 🔴

- ⬜ Implementar **Flyway** para migraciones versionadas de Postgres.
- ⬜ Cada microservicio debe tener su **propio schema/BD** (Database per Service Pattern):

| Microservicio         | Base de Datos      | Schema/DB                          |
| --------------------- | ------------------ | ---------------------------------- |
| `micro-customer`      | Postgres           | `customer_db`                      |
| `micro-drivers`       | Postgres           | `drivers_db`                       |
| `micro-productos`     | Postgres           | `products_db`                      |
| `micro-payments`      | Postgres           | `payments_db`                      |
| `micro-realtime`      | Postgres + MongoDB | `orders_db` + colección `tracking` |
| `micro-notifications` | MongoDB            | colección `notification_log`       |
| Keycloak              | Postgres           | `keycloak_db`                      |

- ⬜ Agregar **índices** en columnas de búsqueda frecuente (email, order_id, status).
- ⬜ Agregar **campos de auditoría** (`createdAt`, `updatedAt`) con `@CreatedDate` y `@LastModifiedDate` en TODAS las entidades.
- ⬜ Implementar **`BaseEntity`** abstracta con campos comunes (id, createdAt, updatedAt).

#### 1.6.1 Mejoras en el Modelo de Entidades 🔴

> ⚠️ **Problemas detectados en el código actual y correcciones propuestas:**

**1. `Customer` — Campos redundantes:**
```diff
@Entity
public class Customer {
-   private String address;   // ELIMINAR: redundante con Address entity
-   private String city;      // ELIMINAR: redundante con Address entity
    
    // Mantener @ManyToMany (varios usuarios pueden compartir la misma dirección)
    @ManyToMany(cascade = {CascadeType.PERSIST, CascadeType.MERGE})
    @JoinTable(name = "customer_addresses",
        joinColumns = @JoinColumn(name = "customer_id"),
        inverseJoinColumns = @JoinColumn(name = "address_id"))
    private List<Address> addresses = new ArrayList<>();
    // Usar addresses con isDefault=true para la dirección principal
}
```

**2. `Payment` — Agregar soporte para reembolsos:**
```diff
@Entity
public class Payment {
    // ... campos existentes ...
+   private BigDecimal refundAmount;    // Para reembolsos parciales
+   private String refundReason;
+   private LocalDateTime refundedAt;
+   private String receiptUrl;          // URL del recibo (Stripe/PayPal)
}
```

**3. `Order` — Mejorar estructura de dirección:**
```diff
@Entity
public class Order {
-   private String deliveryAddress;     // Texto libre, difícil de buscar
+   @Embedded
+   private DeliveryAddress deliveryAddress;  // Estructura con calle, ciudad, etc.
    // ... lat/lng se mantienen ...
}

+@Embeddable
+public class DeliveryAddress {
+    private String street;
+    private String city;
+    private String zipCode;
+    private String reference;  // "Casa azul, portón negro"
+}
```

**4. NUEVA entidad `OrderEvent` — Para Event Sourcing:**
```java
@Entity
@Table(name = "order_events")
public class OrderEvent {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private Long orderId;
    
    @Enumerated(EnumType.STRING)
    private OrderEventType eventType;
    // CREATED, INVENTORY_RESERVED, PAYMENT_PROCESSED, 
    // DRIVER_ASSIGNED, PICKED_UP, DELIVERED, CANCELLED, REFUNDED
    
    @Column(columnDefinition = "jsonb")
    private String payload;  // JSON con datos del evento
    
    private String triggeredBy;  // userId o "SYSTEM"
    private LocalDateTime occurredAt;
}
```

**5. NUEVA entidad `StockReservation` — Para el patrón Saga:**
```java
@Entity
@Table(name = "stock_reservations")
public class StockReservation {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private Long orderId;
    private Long productId;
    private Integer quantity;
    
    @Enumerated(EnumType.STRING)
    private ReservationStatus status;  // RESERVED, CONFIRMED, RELEASED
    
    private LocalDateTime reservedAt;
    private LocalDateTime expiresAt;  // Auto-liberar si no se confirma en X minutos
}
```


**7. NUEVA entidad `DeliveryZone` — Zonas de entrega:**
```java
@Entity
@Table(name = "delivery_zones")
public class DeliveryZone {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String name;           // "Zona Centro", "Zona Norte"
    private Double centerLatitude;
    private Double centerLongitude;
    private Double radiusKm;       // Radio de cobertura
    private BigDecimal deliveryFee;
    private Integer estimatedMinutes;
    private boolean active;
}
```

**8. Mejora en `Menu` — Horarios y programación:**
```diff
@Entity
public class Menu {
    // ... campos existentes ...
+   @Enumerated(EnumType.STRING)
+   private MenuType type;          // DESAYUNO, ALMUERZO, CENA, HAPPY_HOUR, ESPECIAL
+   private LocalTime availableFrom;  // 08:00
+   private LocalTime availableUntil; // 14:00
+   @ElementCollection
+   private Set<DayOfWeek> availableDays; // LUNES a DOMINGO
}
```

**8. Agregar índices compuestos:**
```sql
-- micro-realtime / orders_db
CREATE INDEX idx_orders_customer_status ON orders(customer_id, status);
CREATE INDEX idx_orders_driver_status ON orders(driver_id, status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_order_items_order_product ON order_items(order_id, product_id);

-- micro-payments / payments_db
CREATE INDEX idx_payments_order ON payments(order_id);
CREATE INDEX idx_payments_customer_status ON payments(customer_id, status);
CREATE INDEX idx_payments_idempotency ON payments(idempotency_key);

-- micro-drivers / drivers_db
CREATE INDEX idx_drivers_status_available ON drivers(status, available);
CREATE INDEX idx_drivers_location ON drivers(current_latitude, current_longitude);

-- micro-productos / products_db
CREATE INDEX idx_products_category_available ON products(category, available);
CREATE INDEX idx_stock_reservations_order ON stock_reservations(order_id, status);

-- outbox (en cada servicio que publique eventos)
CREATE INDEX idx_outbox_status ON outbox_events(status, created_at);
```

#### 1.6.2 Diagrama de Relaciones entre Entidades (por servicio)

```
┌─────────────── micro-customer ───────────────┐
│                                              │
│  Customer (N) ─────── (M) Address            │
│  │ userId, email            │ street, city   │
│  │ totalOrders, totalSpent  │ colonia, state │
│  │ memberSince              │ lat, lng       │
│  │   (via customer_addresses join table)      │
│                                              │
└──────────────────────────────────────────────┘
              │ customerId (referencia cruzada)
              ▼
┌─────────────── micro-realtime ───────────────┐
│                                              │
│  Order (1) ──────< (N) OrderItem             │
│  │ customerId, driverId   │ productId        │
│  │ status, total, tip     │ productName      │
│  │ deliveryAddress (embed) │ unitPrice, qty   │
│  │                                           │
│  Order (1) ──────< (N) OrderEvent            │
│                    │ eventType, payload       │
│                    │ triggeredBy, occurredAt  │
│                                              │
│  OutboxEvent (Outbox Pattern)                │
│  │ aggregateType, eventType, payload, status │
│                                              │
│  TrackingEvent (MongoDB)                     │
│  │ orderId, driverId, lat, lng, eventType    │
│                                              │
└──────────────────────────────────────────────┘
              │ driverId        │ orderId
              ▼                 ▼
┌─────────── micro-drivers ────┐ ┌──── micro-payments ─────────┐
│                              │ │                              │
│  Driver (1) ──< (N) Rating   │ │  Payment                    │
│  │ name, email, vehicle     │ │  │ orderId, customerId       │
│  │ status, lat, lng         │ │  │ amount, method, status    │
│  │        │ rating, comment │ │  │ transactionId             │
│  │        │ orderId         │ │  │ refundAmount, refundReason│
│                              │ │                              │
│  OutboxEvent                 │ │  OutboxEvent                │
│                              │ │                              │
└──────────────────────────────┘ └──────────────────────────────┘
                                          │ productId
                                          ▼
┌───────────── micro-productos ────────────────┐
│                                              │
│  Menu (1) ──────< (N) Product                │
│  │ name, type              │ name, price     │
│  │ availableFrom/Until     │ category, stock │
│  │ availableDays           │ imageUrl        │
│                                              │
│  StockReservation          OutboxEvent        │
│  │ orderId, productId                        │
│  │ qty, status, expires                      │
│                                              │
│  DeliveryZone                                │
│  │ name, center lat/lng                      │
│  │ radiusKm, deliveryFee                     │
│                                              │
└──────────────────────────────────────────────┘
```

### 1.7 Estado de Órdenes — State Pattern 🔴

- ⬜ Implementar **State Pattern** en `micro-realtime` para transiciones controladas de orden.

```java
public interface OrderState {
    OrderState next(OrderContext context);
    OrderState cancel(OrderContext context);
    String getStateName();
}

public class PendingState implements OrderState {
    @Override
    public OrderState next(OrderContext ctx) {
        ctx.reserveInventory();
        return new PaidState();
    }
    @Override
    public OrderState cancel(OrderContext ctx) {
        ctx.notifyCustomer("Orden cancelada");
        return new CancelledState();
    }
}
// Estados: PENDING → PAID → PREPARING → ON_THE_WAY → DELIVERED
//          Cualquiera puede → CANCELLED (con compensación)
```

### 1.8 CQRS + Event Sourcing 🟡

- ⬜ **CQRS** en `micro-realtime`:
  - Command (escritura): Postgres — guardar orden, cambiar estado.
  - Query (lectura): MongoDB — vista desnormalizada para lectura rápida.
  - Un evento Kafka sincroniza Postgres → MongoDB.
- ⬜ **Event Sourcing**: Guardar todos los eventos de la orden en la tabla `order_events` (ORDEN_CREADA → PAGO_CONFIRMADO → EN_CAMINO → ENTREGADA).
- ⬜ Implementar **snapshots** periódicos para no tener que reconstruir todo el estado desde cero.

### 1.9 Notificaciones 🟢

- ⬜ Crear `micro-notifications` que escuche eventos de RabbitMQ y envíe:
  - **Emails** (SendGrid) — confirmación de pedido, registro.
  - **Push Notifications** (Firebase Cloud Messaging) — al cliente y conductor.
  - **SMS** opcionales (Twilio) — códigos de verificación.
- ⬜ Implementar **templates de notificación** con Thymeleaf (emails HTML bonitos).
- ⬜ Agregar **preferencias de notificación** por usuario (email sí, SMS no, etc.).

```java
// --- PATRÓN FACTORY (micro-notifications) ---
@Component
public class NotificationFactory {
    public Notification create(NotificationEvent event) {
        return switch (event.getType()) {
            case ORDER_CONFIRMED -> new EmailNotification(event.getEmail(), "Pedido Confirmado", ...);
            case DRIVER_ASSIGNED -> new PushNotification(event.getDeviceToken(), "Conductor en camino", ...);
            case VERIFICATION_CODE -> new SmsNotification(event.getPhone(), "Tu código: " + event.getCode());
        };
    }
}
```

### 1.10 Almacenamiento de Archivos 🟢

- ⬜ Reemplazar volumen local `productos_images` por **MinIO** (S3-compatible, self-hosted) o **Cloudinary**.
- ⬜ Agregar MinIO al Docker Compose con su consola web.
- ⬜ Implementar upload con presigned URLs (el frontend sube directo a MinIO sin pasar por el backend).

### 1.11 API Versioning y Documentación 🟢

- ⬜ Versionar endpoints: `/api/v1/products`, `/api/v2/products`.
- ⬜ Documentar la API con **SpringDoc OpenAPI (Swagger)**.
- ⬜ Agregar **Swagger UI** unificado a través del Gateway (un solo punto de documentación).
- ⬜ Exportar colección de **Postman** / **Bruno** para testing manual.

### 1.12 Adapter Pattern — Proveedores intercambiables 🟡

```java
// --- PATRÓN ADAPTER (mapas, notificaciones) ---
public interface GeocodingService {
    LatLng geocode(String address);
    double calculateDistance(LatLng from, LatLng to);
}

@Component @Profile("osm")
public class NominatimGeocodingAdapter implements GeocodingService { /* Gratis */ }

@Component @Profile("google")
public class GoogleMapsGeocodingAdapter implements GeocodingService { /* De pago */ }
// Aplica igual para: EmailAdapter (SendGrid/Mailgun), SmsAdapter (Twilio/Vonage)
```

### 1.13 Builder Pattern — DTOs complejos 🟡

```java
@Builder
public class OrderRequest {
    private String customerId;
    private List<OrderItem> items;
    private String deliveryAddress;
    private String notes;           // opcional
    private BigDecimal tip;         // opcional
    private String paymentMethod;   // "stripe" | "paypal"
    private Long deliveryZoneId;    // zona de entrega seleccionada
}
```

### 1.14 DTO + Mapper con MapStruct 🟡

- ⬜ Reemplazar mapeo manual por **MapStruct** para reducir boilerplate:

```java
@Mapper(componentModel = "spring")
public interface OrderMapper {
    OrderResponse toResponse(Order order);
    Order toEntity(OrderRequest request);
}
```

### 1.15 Asignación de Conductores — Strategy Pattern 🟡

- ⬜ Implementar **Strategy** para asignación inteligente de conductores:

```java
public interface DriverAssignmentStrategy {
    Driver assign(Order order, List<Driver> availableDrivers);
}

@Component("nearest")
public class NearestDriverStrategy implements DriverAssignmentStrategy {
    // Asigna al conductor más cercano al restaurante
}

@Component("leastOrders")
public class LeastOrdersStrategy implements DriverAssignmentStrategy {
    // Asigna al conductor con menos pedidos activos (balance de carga)
}

@Component("bestRated")
public class BestRatedDriverStrategy implements DriverAssignmentStrategy {
    // Asigna al conductor mejor calificado disponible
}
```

---

## 🎨 2. FRONTEND (Angular & React/Next.js)

> **Dos versiones independientes del frontend.** Ambas conectan al mismo backend.
> La versión Angular usa PrimeNG. La versión React usa Next.js 15 + Shadcn/ui.

### 2.1 Mapas — Leaflet (Gratis) 🔴

- ⬜ **Mantener Leaflet + OpenStreetMap** (ya instalado). 100% gratuito, sin límites.
- ⬜ Google Maps NO es gratis (~$200 USD/mes de crédito, luego cobra). Solo si necesitas Street View o Places Autocomplete.
- ⬜ Implementar tracking en vivo del conductor con WebSockets + marcadores animados.
- ⬜ Mostrar zonas de entrega en el mapa (polígonos/círculos).

### 2.2 Pagos Seguros en la UI 🔴

- ⬜ **Stripe Elements** (`@stripe/stripe-js`): iframe seguro. El frontend NUNCA toca datos de tarjeta.
- ⬜ **PayPal Smart Buttons** (`@paypal/react-paypal-js` / SDK para Angular): popup de PayPal.
- ⬜ Selector de método de pago (tarjeta vs PayPal) antes del checkout.

### 2.3 Autenticación con Keycloak 🔴

- ⬜ **Angular**: `keycloak-angular` + `keycloak-js`. Guard para proteger rutas.
- ⬜ **React/Next.js**: `next-auth` con provider Keycloak o `react-oidc-context`.
- ⬜ El frontend NO construye formularios de login; redirige a Keycloak (personalizable con tu branding).

### 2.4 Versión React — Next.js 15 🔴

- ⬜ **Next.js 15** con App Router para SSR/SSG (SEO, performance).
- ⬜ **Zustand** para estado global (carrito, sesión, notificaciones).
- ⬜ **TanStack Query** para data fetching, caché y sincronización con el servidor.
- ⬜ **Socket.io-client** o WebSocket nativo para tracking en tiempo real.
- ⬜ **Shadcn/ui** + **Tailwind CSS** como sistema de diseño.
- ⬜ **Leaflet** (`react-leaflet`) para mapas.
- ⬜ **next-intl** para internacionalización (en/es).
- ⬜ **API Routes** de Next.js como BFF (Backend for Frontend) si se necesita.

### 2.5 Versión Angular — Angular 19 🔴

- ⬜ **Angular 19** con Standalone Components y Signals.
- ⬜ **PrimeNG** como librería de componentes UI.
- ⬜ **Tailwind CSS** para estilos personalizados.
- ⬜ **NgRx SignalStore** o servicios con Signals para estado global.
- ⬜ **Leaflet** (`@asymmetrik/ngx-leaflet`) para mapas.
- ⬜ **ngx-translate** para internacionalización (en/es).

### 2.6 UX / Mejoras Generales 🟡

- ⬜ **PWA**: Service Worker para funcionar offline e "instalar" en el celular.
- ⬜ **i18n**: Inglés/Español en ambas versiones.
- ⬜ **Skeleton loaders** en lugar de spinners.
- ⬜ **Optimistic updates** en el carrito de compras.
- ⬜ **Dark mode** toggle en ambas versiones.
- ⬜ **Responsive design** mobile-first (el 80% de los usuarios pedirán desde el celular).
- ⬜ **Animaciones** con Framer Motion (React) y Angular Animations.
- ⬜ **Toast notifications** en tiempo real (pedido confirmado, conductor asignado, etc.).

### 2.7 Estructura de Páginas (ambas versiones) 🟡

| Página | Ruta | Descripción |
|---|---|---|
| Home / Landing | `/` | Menú del día, promociones, CTA para pedir |
| Menú / Catálogo | `/menu` | Productos por categoría, búsqueda, filtros |
| Detalle Producto | `/menu/:id` | Imagen, descripción, opciones, agregar al carrito |
| Carrito | `/cart` | Resumen, selección de dirección |
| Checkout | `/checkout` | Método de pago (Stripe/PayPal), confirmar pedido |
| Tracking | `/tracking/:orderId` | Mapa con conductor en tiempo real, estados |
| Mis Pedidos | `/orders` | Historial de pedidos, repetir pedido |
| Perfil | `/profile` | Datos personales, direcciones, preferencias |
| Login | `/auth` (Keycloak redirect) | Manejado por Keycloak |
| Admin Dashboard | `/admin` | Gestión de productos, pedidos, conductores |
| Driver Dashboard | `/driver` | Pedidos asignados, navegación, toggle disponibilidad |

---

## 🛡️ 3. SEGURIDAD

### 3.1 Rate Limiting 🔴

- ⬜ **Rate Limiting en el API Gateway** con `spring-cloud-gateway` + Redis.
- ⬜ Límites por endpoint:
  - `/auth/login` → máx **5 intentos/minuto** (previene brute force).
  - `/payments` → máx **10 requests/minuto**.
  - `/register` → máx **3 requests/minuto** (previene spam de cuentas).
  - General → máx **100 requests/minuto** por IP.

### 3.2 Bloqueo y Baneo de IPs 🔴

- ⬜ **IP Blacklist dinámico** en el Gateway:
  - IP supera X intentos fallidos de login en Y minutos → baneo temporal (15-30 min).
  - IP hace scraping masivo → baneo permanente (guardar en Redis).
- ⬜ **Filtro global** en Spring Cloud Gateway que consulte Redis antes de procesar la request.
- ⬜ Considerar **Fail2Ban** o un **WAF** (Web Application Firewall).

```
Cadena de filtros del Gateway (Chain of Responsibility):
Request → [IP Blacklist Filter]
        → [Rate Limit Filter]
        → [JWT Validation Filter]
        → [CORS Filter]
        → [Security Headers Filter]
        → [Logging Filter]
        → Microservicio destino
```

### 3.3 Protección contra Ataques Comunes 🔴

- ⬜ **CORS**: Solo tu dominio del frontend, nunca `*`.
- ⬜ **CSRF**: No aplica con JWT/Bearer tokens (no uses cookies de sesión).
- ⬜ **SQL Injection**: JPA/Hibernate con parámetros preparados siempre (nunca concatenar SQL).
- ⬜ **XSS**: Sanitizar todo input. Cuidado con `innerHTML` / `dangerouslySetInnerHTML`.
- ⬜ **SSRF**: Validar URLs de usuario (ej: imágenes de perfil). No permitir IPs internas.

### 3.4 Headers de Seguridad HTTP 🔴

- ⬜ Configurar en Gateway o Nginx:
  - `Strict-Transport-Security` (HSTS) — Fuerza HTTPS.
  - `X-Content-Type-Options: nosniff` — Previene MIME sniffing.
  - `X-Frame-Options: DENY` — Previene clickjacking.
  - `Content-Security-Policy` — Controla scripts/estilos permitidos.
  - `X-XSS-Protection: 0` — Desactivar filtro legacy (CSP lo reemplaza).
  - `Referrer-Policy: strict-origin-when-cross-origin`.

### 3.5 Seguridad de Tokens JWT 🔴

- ⬜ **Access Token** vida corta: 5-15 minutos.
- ⬜ **Refresh Token** vida media: 7-30 días, con rotación.
- ⬜ Firmar con **RS256** (clave asimétrica) en lugar de HS256.
- ⬜ Almacenar en el frontend en **memoria JS**, NUNCA en `localStorage`.

### 3.6 Protección de Datos y Encriptación 🟡

- ⬜ **HTTPS/TLS** obligatorio en producción (**Let's Encrypt** + Nginx).
- ⬜ Contraseñas con bcrypt (Keycloak lo maneja). NUNCA almacenar tarjetas.
- ⬜ Usar **Docker Secrets** o **HashiCorp Vault** en producción (no `.env` en texto plano).

### 3.7 Validación y Sanitización de Inputs 🟡

- ⬜ **Jakarta Validation** (`@Valid`, `@NotNull`, `@Size`, `@Email`, `@Pattern`) en todos los DTOs.
- ⬜ Validar tamaño máximo de archivos subidos.
- ⬜ Limitar tamaño del body en el Gateway (`spring.codec.max-in-memory-size`).

### 3.8 Auditoría y Logging de Seguridad 🟡

- ⬜ Loguear **intentos de login** (exitosos y fallidos) con IP, timestamp, user-agent.
- ⬜ Loguear **accesos a recursos sensibles** (pagos, cambios de rol, eliminaciones).
- ⬜ Loguear **cambios administrativos** (quién cambió qué y cuándo).
- ⬜ **Alertas automáticas**: 50 logins fallidos en 1 minuto → alerta en Slack/email.

### 3.9 Seguridad de Contenedores Docker 🟢

- ⬜ Ejecutar contenedores con **usuarios no-root** (`USER 1001` en Dockerfile).
- ⬜ Imágenes base mínimas (`eclipse-temurin:21-jre-alpine`).
- ⬜ Escanear imágenes con **Trivy** o **Docker Scout**.
- ⬜ No exponer puertos internos al host (solo Gateway y Nginx).

### 3.10 Dependency Scanning 🟢

- ⬜ **OWASP Dependency-Check** (Maven plugin) en pipeline CI.
- ⬜ **npm audit** / **Snyk** para el frontend.

---

## 🐳 4. INFRAESTRUCTURA & DEVOPS

### 4.1 Dockerfiles Multi-Stage 🔴

- ⬜ **Backend**: Etapa 1 compila con Maven → Etapa 2 copia `.jar` a `jre-alpine` (~150MB vs ~800MB).
- ⬜ **Frontend Angular**: Etapa 1 compila con Node → Etapa 2 copia estáticos a `nginx:alpine` (~25MB).
- ⬜ **Frontend Next.js**: Etapa 1 compila con Node → Etapa 2 usa `node:alpine` con standalone output (~80MB).

```dockerfile
# --- Ejemplo Backend Multi-Stage ---
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline   # Cachea dependencias en capa Docker
COPY src ./src
RUN mvn package -DskipTests

FROM eclipse-temurin:21-jre-alpine
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://localhost:8080/actuator/health || exit 1
ENTRYPOINT ["java", "-jar", "/app.jar"]
```

```dockerfile
# --- Ejemplo Frontend Next.js Multi-Stage ---
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
```

### 4.2 Docker Compose Completo 🔴

- ⬜ Agregar al compose actual:
  - **Keycloak** (con su propia BD Postgres).
  - **Redis** (caché y rate limiting).
  - **RabbitMQ** (con management UI en puerto 15672).
  - **MinIO** (almacenamiento de archivos S3-compatible).
  - **Nginx** como reverse proxy + SSL termination.
  - **Frontend Angular** y **Frontend Next.js** como contenedores.

### 4.3 Gestión de Secretos 🔴

- ⬜ Sacar contraseñas hardcodeadas del `docker-compose.yml`.
- ⬜ Usar `.env` (desarrollo) en `.gitignore`.
- ⬜ En producción: **Docker Secrets** o **HashiCorp Vault**.

### 4.4 CI/CD Pipeline 🟡

- ⬜ Configurar **GitHub Actions**:
  1. `mvn test` — Tests unitarios de cada microservicio.
  2. `npm test` — Tests del frontend.
  3. `docker build` — Construir imágenes.
  4. `trivy scan` — Escanear vulnerabilidades.
  5. `docker push` — Subir a Docker Hub o GitHub Container Registry.
  6. Deploy automático al servidor (SSH + docker-compose pull + up).

### 4.5 Entornos (Dev / Staging / Prod) 🟡

- ⬜ Perfiles Spring: `application-dev.yml`, `application-staging.yml`, `application-prod.yml`.
- ⬜ `docker-compose.dev.yml` (puertos expuestos, hot-reload) y `docker-compose.prod.yml` (optimizado).

### Servicios Docker Compose Final

| Servicio                        | Imagen                      | Puerto              |
| ------------------------------- | --------------------------- | ------------------- |
| **Nginx** (Reverse Proxy + SSL) | `nginx:alpine`              | 80, 443             |
| **Keycloak**                    | `quay.io/keycloak/keycloak` | 8080 (solo dev)     |
| **Eureka**                      | Build local                 | 8762 (solo dev)     |
| **API Gateway**                 | Build local                 | 8090 (interno)      |
| **micro-customer**              | Build local                 | interno             |
| **micro-drivers**               | Build local                 | interno             |
| **micro-productos**             | Build local                 | interno             |
| **micro-payments**              | Build local                 | interno             |
| **micro-realtime**              | Build local                 | interno             |
| **micro-notifications** (nuevo) | Build local                 | interno             |
| **Postgres**                    | `postgres:16`               | 5432 (solo dev)     |
| **MongoDB**                     | `mongo:7`                   | 27017 (solo dev)    |
| **Redis** (nuevo)               | `redis:7-alpine`            | 6379 (solo dev)     |
| **RabbitMQ** (nuevo)            | `rabbitmq:3-management`     | 15672 (solo dev)    |
| **Kafka + Zookeeper**           | Confluent                   | interno             |
| **MinIO** (nuevo)               | `minio/minio`               | 9000/9001 (solo dev)|
| **Frontend Angular**            | Build + Nginx               | interno (via Nginx) |
| **Frontend Next.js**            | Build + Node                | interno (via Nginx) |
| **Prometheus** (nuevo)          | `prom/prometheus`           | 9090 (solo dev)     |
| **Grafana** (nuevo)             | `grafana/grafana`           | 3000 (solo dev)     |

---

## 🏗️ 5. ETAPAS DE CONSTRUCCIÓN Y DESPLIEGUE

### 5.1 Etapa 1 — Desarrollo Local (Docker Compose) 🔴

> **Objetivo:** Levantar todo el ecosistema en tu máquina con un solo comando.

```bash
# Clonar y configurar
git clone https://github.com/tu-usuario/Ceiba-Bar.git
cd Ceiba-Bar
cp .env.example .env  # Editar con tus valores

# Levantar todo
docker-compose -f docker-compose.dev.yml up --build -d

# Verificar que todo esté corriendo
docker-compose ps
```

**docker-compose.dev.yml** — Características:
- Todos los puertos expuestos para debugging
- Volúmenes montados para hot-reload del código
- Variables de entorno desde `.env`
- Perfiles Spring en modo `dev`
- Health checks en todos los servicios

**docker-compose.prod.yml** — Características:
- Solo Nginx expone puertos 80/443
- Imágenes multi-stage (ligeras)
- Variables desde Docker Secrets
- Perfiles Spring en modo `prod`
- Resource limits (CPU/RAM) por contenedor
- Restart policies (`unless-stopped`)
- Logging centralizado

```yaml
# Ejemplo parcial de docker-compose.prod.yml
services:
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
    depends_on:
      gateway:
        condition: service_healthy
    restart: unless-stopped
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 256M

  gateway:
    build:
      context: ./micro-gateway
      dockerfile: Dockerfile
    environment:
      - SPRING_PROFILES_ACTIVE=prod
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost:8090/actuator/health"]
      interval: 30s
      timeout: 5s
      retries: 3
    restart: unless-stopped
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 512M
    # Puerto NO expuesto al host
```

### 5.2 Etapa 2 — Kubernetes Local (Minikube) 🟡

> **Objetivo:** Aprender Kubernetes desplegando el mismo proyecto en Minikube.
> Esto agrega MUCHO valor al CV: "Orquestación con Kubernetes".

#### 5.2.1 Prerrequisitos

```bash
# Instalar Minikube
choco install minikube    # Windows (Chocolatey)

# Instalar kubectl
choco install kubernetes-cli

# Instalar Helm (gestor de paquetes K8s)
choco install kubernetes-helm

# Iniciar cluster
minikube start --cpus=4 --memory=8192 --driver=docker
minikube addons enable ingress
minikube addons enable metrics-server
```

#### 5.2.2 Estructura de archivos K8s

```
k8s/
├── base/                          # Configuración base (compartida)
│   ├── namespace.yaml
│   ├── configmaps/
│   │   ├── gateway-config.yaml
│   │   └── nginx-config.yaml
│   ├── secrets/
│   │   ├── db-secrets.yaml        # (encriptados con SOPS o sealed-secrets)
│   │   └── app-secrets.yaml
│   ├── databases/
│   │   ├── postgres-statefulset.yaml
│   │   ├── postgres-service.yaml
│   │   ├── postgres-pvc.yaml
│   │   ├── mongodb-statefulset.yaml
│   │   ├── mongodb-service.yaml
│   │   ├── redis-deployment.yaml
│   │   └── redis-service.yaml
│   ├── messaging/
│   │   ├── rabbitmq-statefulset.yaml
│   │   ├── kafka-statefulset.yaml
│   │   └── zookeeper-statefulset.yaml
│   ├── auth/
│   │   ├── keycloak-deployment.yaml
│   │   └── keycloak-service.yaml
│   ├── services/
│   │   ├── eureka-deployment.yaml
│   │   ├── gateway-deployment.yaml
│   │   ├── customer-deployment.yaml
│   │   ├── drivers-deployment.yaml
│   │   ├── productos-deployment.yaml
│   │   ├── payments-deployment.yaml
│   │   ├── realtime-deployment.yaml
│   │   └── notifications-deployment.yaml
│   ├── frontend/
│   │   ├── angular-deployment.yaml
│   │   └── nextjs-deployment.yaml
│   ├── monitoring/
│   │   ├── prometheus-deployment.yaml
│   │   └── grafana-deployment.yaml
│   └── ingress.yaml               # Reglas de enrutamiento
├── overlays/
│   ├── dev/
│   │   └── kustomization.yaml     # Patches para desarrollo
│   └── prod/
│       └── kustomization.yaml     # Patches para producción
└── helm/                          # Alternativa: Helm charts
    └── ceiba-bar/
        ├── Chart.yaml
        ├── values.yaml
        ├── values-dev.yaml
        └── values-prod.yaml
```

#### 5.2.3 Ejemplo de manifiestos K8s

```yaml
# --- k8s/base/namespace.yaml ---
apiVersion: v1
kind: Namespace
metadata:
  name: ceiba-bar
```

```yaml
# --- k8s/base/services/gateway-deployment.yaml ---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: gateway
  namespace: ceiba-bar
  labels:
    app: gateway
spec:
  replicas: 2  # Alta disponibilidad
  selector:
    matchLabels:
      app: gateway
  template:
    metadata:
      labels:
        app: gateway
    spec:
      containers:
        - name: gateway
          image: ceiba-bar/gateway:latest
          ports:
            - containerPort: 8090
          env:
            - name: SPRING_PROFILES_ACTIVE
              value: "prod"
            - name: EUREKA_CLIENT_SERVICEURL_DEFAULTZONE
              value: "http://eureka:8762/eureka/"
          envFrom:
            - secretRef:
                name: app-secrets
          resources:
            requests:
              cpu: "250m"
              memory: "256Mi"
            limits:
              cpu: "1000m"
              memory: "512Mi"
          livenessProbe:
            httpGet:
              path: /actuator/health/liveness
              port: 8090
            initialDelaySeconds: 60
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /actuator/health/readiness
              port: 8090
            initialDelaySeconds: 30
            periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: gateway
  namespace: ceiba-bar
spec:
  selector:
    app: gateway
  ports:
    - port: 8090
      targetPort: 8090
  type: ClusterIP
```

```yaml
# --- k8s/base/ingress.yaml ---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: ceiba-bar-ingress
  namespace: ceiba-bar
  annotations:
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/proxy-body-size: "10m"
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
spec:
  ingressClassName: nginx
  tls:
    - hosts:
        - ceiba-bar.com
        - api.ceiba-bar.com
      secretName: ceiba-bar-tls
  rules:
    - host: ceiba-bar.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: frontend-angular  # o frontend-nextjs
                port:
                  number: 80
    - host: api.ceiba-bar.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: gateway
                port:
                  number: 8090
```

#### 5.2.4 Comandos para desplegar en Minikube

```bash
# Construir imágenes dentro de Minikube
eval $(minikube docker-env)
docker-compose build

# Aplicar manifiestos
kubectl apply -f k8s/base/namespace.yaml
kubectl apply -f k8s/base/ --recursive

# O usar Kustomize
kubectl apply -k k8s/overlays/dev/

# Verificar
kubectl get pods -n ceiba-bar
kubectl get services -n ceiba-bar

# Acceder a la app
minikube service frontend-angular -n ceiba-bar --url

# Dashboard de Kubernetes
minikube dashboard

# Escalar un servicio
kubectl scale deployment gateway --replicas=3 -n ceiba-bar

# Ver logs
kubectl logs -f deployment/gateway -n ceiba-bar
```

#### 5.2.5 Ventajas de K8s sobre Docker Compose

| Característica | Docker Compose | Kubernetes |
|---|---|---|
| Escalado automático | ❌ Manual | ✅ HPA (Horizontal Pod Autoscaler) |
| Self-healing | ❌ | ✅ Restart automático de pods caídos |
| Rolling updates | ❌ | ✅ Zero-downtime deployments |
| Service discovery | Eureka | ✅ DNS interno de K8s (podrías eliminar Eureka) |
| Secretos | `.env` archivo | ✅ Kubernetes Secrets (encriptados) |
| Load balancing | Nginx manual | ✅ Ingress Controller integrado |
| Monitoreo | Manual | ✅ Prometheus Operator, metrics-server |

### 5.3 Etapa 3 — Deploy en VPS (Producción) 🔴

> Se detallan 3 opciones: **Hetzner** (recomendada), AWS y Azure.
> La arquitectura de despliegue es la misma para las tres: Docker Compose en una VM.

---

## ☁️ 6. DEPLOYMENT

### 6.1 Arquitectura de Deployment (igual para todas las opciones)

```
Internet
   │
   ▼
[IP Pública / Dominio]
   │
   ▼
┌──────────────────────────────────────────┐
│           VPS (Ubuntu 24.04)             │
│                                          │
│  Docker Compose                          │
│  ┌────────────────────────────────────┐  │
│  │ Nginx (:80, :443)                  │  │
│  │  ├── /          → Frontend         │  │
│  │  ├── /api/*     → API Gateway      │  │
│  │  └── /auth/*    → Keycloak         │  │
│  ├────────────────────────────────────┤  │
│  │ API Gateway (Spring)               │  │
│  │ Keycloak                           │  │
│  │ Microservicios (customer, drivers, │  │
│  │   productos, payments, realtime,   │  │
│  │   notifications)                   │  │
│  ├────────────────────────────────────┤  │
│  │ Postgres │ MongoDB │ Redis         │  │
│  │ RabbitMQ │ Kafka   │ MinIO         │  │
│  └────────────────────────────────────┘  │
└──────────────────────────────────────────┘
```

---

### 6.2 OPCIÓN A — Hetzner (⭐ RECOMENDADA) 🔴

> **¿Por qué Hetzner?** Mejor relación precio/rendimiento del mercado. Servidores en Europa,
> perfecto para proyectos personales y startups. Hasta 3x más barato que AWS/Azure.

**Servicio principal:** Hetzner Cloud — VPS (Cloud Server)

**Instancia recomendada:**
| Instancia | RAM | CPU | Disco | Costo | Notas |
|---|---|---|---|---|---|
| `CX22` | 4GB | 2 vCPU (shared) | 40GB SSD | **€4.35/mes (~$4.75)** | ⚠️ Justo, desarrollo |
| `CX32` | 8GB | 4 vCPU (shared) | 80GB SSD | **€7.69/mes (~$8.40)** | ✅ Recomendada |
| `CX42` | 16GB | 4 vCPU (shared) | 160GB SSD | **€15.59/mes (~$17)** | ✅ Cómoda para todo |
| `CCX23` | 8GB | 2 vCPU (dedicado) | 80GB SSD | **€16.69/mes (~$18)** | ✅✅ CPU dedicada |

> 💡 Comparación: Un `CX32` de Hetzner (8GB, €7.69/mes) equivale a un `t3.large` de AWS (~$60/mes).
> **¡Es ~7 veces más barato!**

**Pasos para desplegar en Hetzner:**

- ⬜ Crear cuenta en [Hetzner Cloud](https://www.hetzner.com/cloud) (sin tarjeta de crédito para explorar).
- ⬜ Crear Cloud Server con **Ubuntu 24.04** (CX32 o CX42).
- ⬜ Seleccionar datacenter: **Falkenstein (DE)** o **Helsinki (FI)** (los más baratos).
- ⬜ Agregar **SSH Key** al crear el servidor (más seguro que contraseña).
- ⬜ Configurar **Firewall** en el panel de Hetzner:
  - Puerto 80 (HTTP) → abierto
  - Puerto 443 (HTTPS) → abierto
  - Puerto 22 (SSH) → solo tu IP
  - Todos los demás → cerrados
- ⬜ Conectar por SSH e instalar Docker + Docker Compose.
- ⬜ Clonar tu repo, subir `.env`, ejecutar `docker-compose -f docker-compose.prod.yml up -d`.
- ⬜ Configurar SSL con **Let's Encrypt** (certbot + Nginx).
- ⬜ (Opcional) Registrar dominio (~$10/año en Namecheap) y configurar DNS.
- ⬜ (Opcional) Configurar **Hetzner Volumes** para persistencia de BD separada del disco del servidor.
- ⬜ (Opcional) Configurar **Hetzner Snapshots** para backups automáticos (+20% del costo).

**Servicios Hetzner adicionales:**
| Servicio | Uso | Costo |
|---|---|---|
| Volumes (SSD extra) | Datos de BD persistentes | €0.052/GB/mes |
| Snapshots | Backups del servidor | 20% del precio del servidor |
| Load Balancer | Si escalas a 2+ servidores | €6.49/mes |
| Floating IP | IP estática reasignable | €5.39/mes |
| DNS | Gestión de dominio | **Gratis** |

**Para apagar y no gastar:**

```bash
# Desde la API de Hetzner (o panel web)
# Parar el servidor (cobra disco, no CPU): ~€1-2/mes
hcloud server shutdown <nombre-servidor>

# O destruir todo (pierdes datos):
hcloud server delete <nombre-servidor>
```

**Script de setup automático para Hetzner:**

```bash
#!/bin/bash
# setup-hetzner.sh — Ejecutar después de crear el servidor

# Actualizar sistema
apt update && apt upgrade -y

# Instalar Docker
curl -fsSL https://get.docker.com | sh
systemctl enable docker

# Instalar Docker Compose v2
apt install docker-compose-plugin -y

# Crear usuario no-root para la app
adduser --disabled-password --gecos "" deploy
usermod -aG docker deploy

# Configurar firewall (UFW)
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw enable

# Configurar swap (útil si tienes poca RAM)
fallocate -l 4G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab

# Instalar certbot para SSL
apt install certbot python3-certbot-nginx -y

echo "✅ Servidor listo. Ahora clona tu repo y ejecuta docker-compose up."
```

**Ventaja para CV:** "Desplegado en Hetzner Cloud con Docker, Nginx, SSL y CI/CD" → Demuestra que sabes optimizar costos y no dependes exclusivamente de AWS.

---

### 6.3 OPCIÓN B — AWS (Amazon Web Services)

**Servicio principal:** EC2 (Elastic Compute Cloud)

**Instancia recomendada:**
| Instancia | RAM | CPU | Costo | Notas |
|---|---|---|---|---|
| `t2.micro` | 1GB | 1 vCPU | Gratis 1 año | ❌ No alcanza para tu proyecto |
| `t3.medium` | 4GB | 2 vCPU | ~$0.04/hora (~$30/mes) | ⚠️ Justo, puede ir lento |
| `t3.large` | 8GB | 2 vCPU | ~$0.08/hora (~$60/mes) | ✅ Recomendada |

**Pasos para desplegar en AWS:**

- ⬜ Crear cuenta AWS (te dan $300 de crédito o free tier según promoción).
- ⬜ Crear instancia EC2 con Ubuntu 24.04 (t3.medium o t3.large).
- ⬜ Configurar **Security Group** (firewall):
  - Puerto 80 (HTTP) → abierto
  - Puerto 443 (HTTPS) → abierto
  - Puerto 22 (SSH) → solo tu IP
  - Todos los demás → cerrados
- ⬜ Asignar **Elastic IP** (IP fija gratuita mientras la instancia esté corriendo).
- ⬜ Conectar por SSH e instalar Docker + Docker Compose.
- ⬜ Clonar tu repo, subir `.env`, ejecutar `docker-compose up -d`.
- ⬜ Configurar SSL con **Let's Encrypt** (certbot + Nginx).
- ⬜ (Opcional) Registrar dominio en **Route 53** (~$12/año para un `.com`).

**Servicios AWS adicionales (opcionales, para aprender):**
| Servicio | Reemplaza | ¿Vale la pena? |
|---|---|---|
| RDS (Postgres) | Tu contenedor Postgres | 🟡 Solo si quieres aprender RDS |
| ElastiCache (Redis) | Tu contenedor Redis | 🟢 No necesario para pruebas |
| ECR (Container Registry) | Docker Hub | 🟡 Si quieres CI/CD con AWS |
| S3 (Storage) | MinIO / volumen local | ✅ Útil para imágenes de productos |

**Para apagar y no gastar:**

```bash
# Parar la instancia (no cobra CPU, sí cobra disco ~$1/mes)
aws ec2 stop-instances --instance-ids i-xxxx

# O destruir todo (pierdes datos)
aws ec2 terminate-instances --instance-ids i-xxxx
```

**Ventaja para CV:** "Desplegado en AWS EC2 con Docker, Nginx y SSL" → muy valorado en entrevistas.

---

### 6.4 OPCIÓN C — Azure (Microsoft)

**Servicio principal:** Virtual Machine (Azure VM)

**Instancia recomendada:**
| Instancia | RAM | CPU | Costo | Notas |
|---|---|---|---|---|
| `B1s` | 1GB | 1 vCPU | Gratis 1 año | ❌ No alcanza |
| `B2s` | 4GB | 2 vCPU | ~$0.04/hora (~$30/mes) | ⚠️ Justo |
| `B2ms` | 8GB | 2 vCPU | ~$0.08/hora (~$60/mes) | ✅ Recomendada |
| `D2s_v3` | 8GB | 2 vCPU | ~$0.10/hora (~$70/mes) | ✅ Más estable |

**Pasos para desplegar en Azure:**

- ⬜ Crear cuenta Azure (te dan **$200 USD de crédito gratis** por 30 días).
- ⬜ Crear VM con Ubuntu 24.04 (B2ms o D2s_v3).
- ⬜ Configurar **NSG (Network Security Group)** (firewall):
  - Puerto 80 (HTTP) → abierto
  - Puerto 443 (HTTPS) → abierto
  - Puerto 22 (SSH) → solo tu IP
  - Todos los demás → cerrados
- ⬜ Asignar **IP pública estática**.
- ⬜ Conectar por SSH e instalar Docker + Docker Compose.
- ⬜ Clonar tu repo, subir `.env`, ejecutar `docker-compose up -d`.
- ⬜ Configurar SSL con **Let's Encrypt** (certbot + Nginx).
- ⬜ (Opcional) Registrar dominio en **Azure DNS**.

**Para apagar y no gastar:**

```bash
# Parar la VM (no cobra CPU, sí cobra disco ~$1-2/mes)
az vm deallocate --resource-group miGrupo --name miVM

# O destruir todo
az group delete --name miGrupo --yes
```

**Ventaja para CV:** "Desplegado en Azure VM con Docker y Nginx" → muy valorado, especialmente en empresas que usan .NET/Microsoft stack.

---

### 6.5 Comparación Final — Hetzner vs AWS vs Azure

| Criterio               | Hetzner ⭐                    | AWS                           | Azure                          |
| ---------------------- | ----------------------------- | ----------------------------- | ------------------------------ |
| **Costo 8GB RAM**      | **~$8/mes** 🏆               | ~$60/mes                      | ~$60/mes                       |
| **Crédito gratis**     | No (pero tan barato que no importa) | Free tier 1 año (limitado)    | $200 USD por 30 días           |
| **Para probar rápido** | ✅✅ Más barato por mucho     | ✅                            | ✅                              |
| **Simplicidad**        | 🟢 Panel simple y directo    | 🔴 Muchas opciones = confuso  | 🟡 Interfaz ordenada           |
| **Documentación**      | Buena                         | Excelente                     | Excelente                      |
| **Comunidad**          | Creciente                     | Más grande                    | Grande                         |
| **Peso en CV**         | 🔥 Demuestra criterio costo  | 🔥🔥🔥 Líder del mercado      | 🔥🔥 Segundo más popular       |
| **Datacenter más cercano** | Europa                   | Global (Virginia, Oregon...)  | Global                         |
| **Para Java/Spring**   | ✅ Igual                      | ✅ Igual                      | ✅ Igual                       |

> **TL;DR:**
> - **Para tu bolsillo y aprendizaje → Hetzner** (8GB por ~$8/mes, imposible de superar).
> - **Para tu CV a largo plazo → AWS** (es el estándar de la industria).
> - **Si ya tienes créditos → Azure** (los $200 de crédito te dan más libertad).
> - **Recomendación:** Despliega en Hetzner para usar diario, y haz un deploy temporal en AWS para captura de pantalla / demostración en entrevistas.

---

## 📊 7. OBSERVABILIDAD

### 7.1 Logging Centralizado 🟡

- ⬜ **Loki + Grafana** (ligero, recomendado) o **ELK Stack** (Elasticsearch + Logstash + Kibana).
- ⬜ Formato de log estructurado (JSON) para facilitar búsquedas.

### 7.2 Métricas — Prometheus + Grafana 🟡

- ⬜ **Spring Boot Actuator** + **Micrometer** → Prometheus → Grafana.
- ⬜ Dashboards: requests/s, latencia p95, tasa de errores, memoria JVM.
- ⬜ Dashboard específico para métricas de negocio (pedidos/hora, ticket promedio, etc.).

### 7.3 Tracing Distribuido 🟢

- ⬜ **Micrometer Tracing** + **Zipkin** o **Jaeger**.
- ⬜ Rastrear request completa: Gateway → Auth → Productos → Pagos.

### 7.4 Health Checks y Alertas 🟢

- ⬜ Actuator `/health` en cada servicio.
- ⬜ Alertas en Grafana: servicio no responde en 30s → Slack/Email/Telegram.
- ⬜ Implementar **UptimeRobot** o **Betterstack** (gratuito) como monitoreo externo.

---

## 🏗️ 8. MAPA VISUAL DE PATRONES

```
┌───────────────────────────────────────────────────────────┐
│                  FRONTEND (Angular / Next.js)              │
│  Patrones: Observer (WebSocket), Adapter (API clients)     │
└─────────────────────────┬─────────────────────────────────┘
                          │
┌─────────────────────────▼─────────────────────────────────┐
│                   NGINX (Reverse Proxy)                    │
│  Patrón: Proxy                                             │
└─────────────────────────┬─────────────────────────────────┘
                          │
┌─────────────────────────▼─────────────────────────────────┐
│                  micro-gateway                             │
│  Patrones: API Gateway, Chain of Responsibility,           │
│            Circuit Breaker (Resilience4j), BFF             │
└───┬─────────┬─────────┬─────────┬─────────┬───────────────┘
    │         │         │         │         │
    ▼         ▼         ▼         ▼         ▼
┌────────┐┌────────┐┌────────┐┌────────┐┌─────────────┐
│Keycloak││product.││payment.││realtime││notifications│
│        ││        ││        ││        ││  (nuevo)    │
│-OAuth2 ││-Repos. ││-Strateg││-CQRS   ││-Factory     │
│-Realm  ││-Decor. ││-Adapter││-State  ││-Adapter     │
│-Broker ││-Builder││-Observ.││-Saga   ││-Observer    │
│        ││-Cache  ││        ││-Event S││             │
└────────┘└────────┘└────────┘└────────┘└─────────────┘
    │         │         │         │         │
    ▼         ▼         ▼         ▼         ▼
┌────────┐┌────────┐ ┌──────────────────────┐
│Postgres││ Redis  │ │  RabbitMQ / Kafka     │
│-Outbox ││ -Cache │ │  -Observer (sistema)  │
│-Flyway ││ -Lock  │ │  -Saga (coreografía)  │
└────────┘└────────┘ └──────────────────────┘
```

---

## 🎯 9. TOP 5 — Implementar PRIMERO

| #   | Patrón                      | Dónde                        | Impacto                            |
| --- | --------------------------- | ---------------------------- | ---------------------------------- |
| 1   | **Strategy**                | `micro-payments`             | Stripe + PayPal sin if/else        |
| 2   | **State**                   | `micro-realtime`             | Transiciones de orden seguras      |
| 3   | **Saga**                    | Entre servicios via RabbitMQ | Consistencia en transacciones      |
| 4   | **Chain of Responsibility** | `micro-gateway`              | Seguridad por capas                |
| 5   | **Adapter**                 | Notificaciones, Mapas, Pagos | Cambiar proveedores sin reescribir |

---

## 🔀 10. ESTRATEGIA GIT — Rama v2

> El código actual se conserva como referencia. Todo el trabajo nuevo se hace en rama `v2`.

**Setup inicial:**

```bash
# Tagear versión actual
git tag -a v1.0 -m "Versión borrador original"
git push origin v1.0

# Crear rama v2
git checkout -b v2

# Trabajar aquí. Para ver código de v1:
git show v1.0:micro_productos/src/...
```

**Estructura del repo en v2:**

```
Ceiba-Bar/
├── backend-delivery/
│   ├── docker-compose.yml            (nuevo, con Keycloak, Redis, RabbitMQ)
│   ├── docker-compose.dev.yml        (para desarrollo local)
│   ├── docker-compose.prod.yml       (para producción, optimizado)
│   ├── .env.example                  (template de variables, SIN secretos)
│   ├── nginx/
│   │   ├── Dockerfile
│   │   └── nginx.conf
│   ├── eureka/
│   ├── micro-gateway/
│   ├── micro-customer/
│   ├── micro-drivers/
│   ├── micro-productos/
│   ├── micro-payments/               (Strategy: Stripe + PayPal)
│   ├── micro-realtime/               (State, CQRS, Saga)
│   └── micro-notifications/          (nuevo: Factory + Adapter)
├── frontend-angular/                  (Angular 19 + PrimeNG)
├── frontend-nextjs/                   (Next.js 15 + Shadcn/ui)
├── k8s/                              (Manifiestos Kubernetes)
│   ├── base/
│   └── overlays/
├── scripts/
│   ├── setup-hetzner.sh
│   ├── setup-aws.sh
│   └── deploy.sh
├── PLAN_MAESTRO.md                    (este archivo)
├── GUIA_PASO_A_PASO.md               (guía de implementación)
└── README.md
```

---

> ⚠️ RECORDATORIO: Sacar la contraseña hardcodeada (`Haikyuu1212`) del docker-compose.yml
> y moverla a un `.env` que esté en `.gitignore` ANTES de subir a un repo público.

> 🔑 En producción, SOLO Nginx debe exponer puertos al exterior (80/443).
> Todo lo demás debe ser accesible únicamente dentro de la red Docker interna.

---

## 📋 CHANGELOG DE MEJORAS (vs versión anterior del plan)

| #  | Mejora | Sección |
|----|--------|---------|
| 1  | ✅ Agregado **Hetzner VPS** como opción de deploy (recomendada por costo) | 6.2 |
| 2  | ✅ Agregado **Kubernetes + Minikube** como etapa de construcción | 5.2 |
| 3  | ✅ Agregado **Docker Compose prod vs dev** con ejemplos detallados | 5.1 |
| 4  | ✅ Cambiado React de Vite a **Next.js 15** (SSR, SEO, App Router) | 2.4 |
| 5  | ✅ Detectados y corregidos **problemas en entidades** (Payment sin refund, tipos de datos, etc.) | 1.6.1 |
| 6  | ✅ Nuevas entidades: **OrderEvent, StockReservation, OutboxEvent, DeliveryZone** | 1.6.1 |
| 7  | ✅ Mejorado **Menu** con horarios y programación por día | 1.6.1 |
| 8  | ✅ Mejorado **Order.deliveryAddress** de String a @Embedded struct | 1.6.1 |
| 9  | ✅ Agregados **índices compuestos** para todas las BD | 1.6.1 |
| 10 | ✅ Agregado **diagrama de relaciones** entre entidades por servicio | 1.6.2 |
| 11 | ✅ Agregada **Strategy para asignación de conductores** | 1.15 |
| 12 | ✅ Agregada tabla de **páginas/rutas** del frontend | 2.7 |
| 13 | ✅ Agregado **MinIO** para almacenamiento de archivos | 1.10, 4.2 |
| 14 | ✅ Agregados **Dockerfiles multi-stage** con ejemplos completos | 4.1 |
| 15 | ✅ Agregada sección de **Helm charts** como alternativa a Kustomize | 5.2.2 |
| 16 | ✅ Agregado **BaseEntity** abstracta para campos de auditoría | 1.6 |
| 17 | ✅ Agregado **script de setup automático** para Hetzner | 6.2 |
| 18 | ✅ Actualizado Ubuntu de 22.04 a **24.04** y Postgres de 15 a **16** | 6.x |
| 19 | ✅ Agregado **dark mode** y **responsive mobile-first** al frontend | 2.6 |
| 20 | ✅ Agregada **comparación K8s vs Docker Compose** | 5.2.5 |
| 21 | ✅ Revertido Customer↔Address a **@ManyToMany** (usuarios pueden compartir dirección) | 1.6.1 |
| 22 | ✅ Eliminada entidad **Coupon** (no habrá cupones) | 1.6.1 |
| 23 | ✅ Agregado **Saga por Coreografía** con diagrama de flujo completo | 1.3.1 |
| 24 | ✅ Agregado **Outbox Pattern** con entidad, servicio y poller completos | 1.3.2 |
