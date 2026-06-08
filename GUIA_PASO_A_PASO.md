# 📖 GUÍA PASO A PASO — Ceiba-Bar Delivery v2

> **Propósito:** Esta guía te lleva de la mano para construir el proyecto desde cero.
> Cada fase tiene prerequisitos, pasos detallados y criterios de verificación.
> Sigue el orden. Cada fase depende de las anteriores.

---

## 🗺️ MAPA DE FASES

```
FASE 0 → FASE 1 → FASE 2 → FASE 3 → FASE 4 → FASE 5 → FASE 6 → FASE 7 → FASE 8
Setup    BD/Ent.  Auth     Negocio   Frontend  Docker    K8s      Deploy    Polish
(1 día)  (3-5d)   (2-3d)   (5-7d)    (7-10d)   (2-3d)   (2-3d)   (1-2d)   (3-5d)
```

**Tiempo estimado total:** 6-10 semanas trabajando algunas horas diarias.

> 💡 **Tip:** No intentes hacer todo perfecto de una vez. Haz que funcione, luego mejóralo.

---

## FASE 0 — Setup del Entorno y Proyecto 🔴

> **Objetivo:** Tener tu entorno listo y la estructura del proyecto preparada en rama v2.
> **Tiempo estimado:** 1 día

### 0.1 Prerrequisitos de Software

Asegúrate de tener todo instalado:

```powershell
# Verificar Java 21
java -version
# Debe mostrar: openjdk version "21.x.x"

# Verificar Maven
mvn -version
# Debe mostrar: Apache Maven 3.9.x

# Verificar Node.js (para los frontends)
node -v     # v20.x o superior
npm -v      # 10.x o superior

# Verificar Docker
docker --version      # Docker version 24.x o superior
docker compose version  # Docker Compose version v2.x

# Verificar Git
git --version   # git version 2.x
```

Si te falta algo:
- **Java 21:** Descarga Eclipse Temurin de https://adoptium.net/
- **Maven:** `choco install maven` (con Chocolatey) o descarga manual
- **Node.js 20:** https://nodejs.org/
- **Docker Desktop:** https://www.docker.com/products/docker-desktop/
- **Git:** https://git-scm.com/downloads

### 0.2 Preparar la rama v2 de Git

```bash
# Ir al directorio del proyecto
cd "C:\Users\crist\OneDrive\Desktop\Trabajos Progrmacion\Proyectos"

# Tagear la versión actual (v1) como referencia
git add -A
git commit -m "Estado actual antes de v2"
git tag -a v1.0 -m "Versión borrador original con microservicios básicos"

# Crear la rama v2
git checkout -b v2

# Verificar que estás en la rama correcta
git branch   # Debe mostrar: * v2
```

### 0.3 Reorganizar la estructura del proyecto

```powershell
# Desde la raíz del proyecto
# Crear las carpetas que faltan
mkdir frontend-angular
mkdir frontend-nextjs
mkdir k8s
mkdir k8s\base
mkdir k8s\base\databases
mkdir k8s\base\services
mkdir k8s\base\messaging
mkdir k8s\base\auth
mkdir k8s\base\frontend
mkdir k8s\base\monitoring
mkdir k8s\base\configmaps
mkdir k8s\base\secrets
mkdir k8s\overlays
mkdir k8s\overlays\dev
mkdir k8s\overlays\prod
mkdir scripts
```

### 0.4 Crear el archivo `.env.example`

Crea `backend-delivery/.env.example`:

```env
# ============================================
# Ceiba-Bar Delivery — Variables de Entorno
# ============================================
# INSTRUCCIONES:
# 1. Copia este archivo como .env: cp .env.example .env
# 2. Rellena los valores reales
# 3. NUNCA subas .env a Git

# --- Base de Datos ---
POSTGRES_USER=ceiba_admin
POSTGRES_PASSWORD=TU_CONTRASEÑA_SEGURA_AQUI
POSTGRES_HOST=postgres
POSTGRES_PORT=5432

MONGO_INITDB_ROOT_USERNAME=ceiba_mongo
MONGO_INITDB_ROOT_PASSWORD=TU_CONTRASEÑA_MONGO_AQUI
MONGO_HOST=mongodb
MONGO_PORT=27017

# --- Redis ---
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=TU_CONTRASEÑA_REDIS_AQUI

# --- RabbitMQ ---
RABBITMQ_DEFAULT_USER=ceiba_rabbit
RABBITMQ_DEFAULT_PASS=TU_CONTRASEÑA_RABBIT_AQUI
RABBITMQ_HOST=rabbitmq
RABBITMQ_PORT=5672

# --- Kafka ---
KAFKA_BOOTSTRAP_SERVERS=kafka:9092

# --- Keycloak ---
KEYCLOAK_ADMIN=admin
KEYCLOAK_ADMIN_PASSWORD=TU_CONTRASEÑA_KEYCLOAK_AQUI
KEYCLOAK_DB_PASSWORD=TU_CONTRASEÑA_KC_DB_AQUI

# --- Stripe ---
STRIPE_SECRET_KEY=sk_test_XXXXXXXXXXXX
STRIPE_PUBLISHABLE_KEY=pk_test_XXXXXXXXXXXX
STRIPE_WEBHOOK_SECRET=whsec_XXXXXXXXXXXX

# --- PayPal ---
PAYPAL_CLIENT_ID=TU_CLIENT_ID
PAYPAL_CLIENT_SECRET=TU_CLIENT_SECRET
PAYPAL_MODE=sandbox

# --- MinIO ---
MINIO_ROOT_USER=ceiba_minio
MINIO_ROOT_PASSWORD=TU_CONTRASEÑA_MINIO_AQUI

# --- Notificaciones ---
SENDGRID_API_KEY=SG.XXXXXXXXXXXXXXXX
FCM_SERVER_KEY=TU_FCM_KEY
TWILIO_ACCOUNT_SID=TU_SID
TWILIO_AUTH_TOKEN=TU_TOKEN

# --- App ---
SPRING_PROFILES_ACTIVE=dev
JWT_SECRET=tu-clave-secreta-larga-256-bits
```

### 0.5 Actualizar `.gitignore`

Agrega estas líneas a tu `.gitignore`:

```gitignore
# Entorno
.env
*.env.local
*.env.production

# IDE
.idea/
*.iml
.vscode/settings.json

# Build
target/
node_modules/
.next/
dist/
build/

# Docker
docker-compose.override.yml

# OS
Thumbs.db
.DS_Store

# Secretos
**/secrets/
*.pem
*.key
```

### ✅ Verificación Fase 0
- [ ] Java 21, Maven, Node 20, Docker y Git instalados
- [ ] Rama `v2` creada y tag `v1.0` puesto
- [ ] Estructura de carpetas creada
- [ ] `.env.example` creado
- [ ] `.gitignore` actualizado
- [ ] Commit: `git commit -m "feat: setup inicial rama v2 - estructura y env"`

---

## FASE 1 — Base de Datos y Entidades 🔴

> **Objetivo:** Corregir las entidades existentes, crear las nuevas, separar BD por servicio.
> **Tiempo estimado:** 3-5 días
> **Prerequisito:** Fase 0

### 1.1 Crear la BaseEntity abstracta

Cada microservicio debe tener esta clase base. Créala en cada uno:

```java
// src/main/java/com/ceiba/<servicio>/entity/BaseEntity.java

@MappedSuperclass
@EntityListeners(AuditingEntityListener.class)
@Getter @Setter
public abstract class BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @CreatedDate
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;
}
```

No olvides habilitar JPA Auditing en la clase `@SpringBootApplication`:

```java
@SpringBootApplication
@EnableJpaAuditing   // ← Agregar esto
public class MicroCustomerApplication { ... }
```

### 1.2 Corregir entidades existentes — micro-customer

**Paso 1:** Editar `Customer.java`:
```java
@Entity
@Table(name = "customers")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Customer extends BaseEntity {

    @Column(nullable = false, unique = true)
    private Long userId;      // Referencia al User en micro-usuarios

    @Column(unique = true)
    private String userEmail;

    private Integer totalOrders = 0;
    private Double totalSpent = 0.0;
    private LocalDateTime memberSince;
    private LocalDateTime lastOrderDate;

    // @ManyToMany: varios clientes pueden compartir la misma dirección (ej: familia)
    @ManyToMany(cascade = {CascadeType.PERSIST, CascadeType.MERGE})
    @JoinTable(name = "customer_addresses",
        joinColumns = @JoinColumn(name = "customer_id"),
        inverseJoinColumns = @JoinColumn(name = "address_id"))
    private List<Address> addresses = new ArrayList<>();
}
```

**Paso 2:** Editar `Address.java`:
```java
@Entity
@Table(name = "addresses")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Address extends BaseEntity {

    private String alias;           // "Casa", "Trabajo"

    @NotBlank
    private String street;

    @NotBlank
    private String colonia;

    @NotBlank
    private String city;

    @NotBlank
    private String state;

    @NotBlank
    private String delegacion;

    @NotBlank
    private String postalCode;

    private String instructions;    // "Casa azul, portón negro"
    private Boolean isDefault = false;
    private Double latitude;
    private Double longitude;

    // Lado inverso del ManyToMany
    @ManyToMany(mappedBy = "addresses")
    private List<Customer> customers = new ArrayList<>();
}
```

### 1.3 Corregir entidades — micro-payments

**Paso 1:** Corregir tipos de datos:
```java
@Entity
@Table(name = "payments", indexes = {
    @Index(name = "idx_payment_order", columnList = "orderId"),
    @Index(name = "idx_payment_idempotency", columnList = "idempotencyKey")
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Payment extends BaseEntity {

    private Long orderId;           // Corregido: era String
    private Long customerId;

    @Column(precision = 10, scale = 2)
    private BigDecimal amount;      // Corregido: era Long

    private String currency = "MXN";

    @Enumerated(EnumType.STRING)
    private PaymentMethod method;   // STRIPE, PAYPAL

    @Enumerated(EnumType.STRING)
    private PaymentStatus status;   // PENDING, PROCESSING, COMPLETED, FAILED, REFUNDED

    private String transactionId;
    private String idempotencyKey;
    private String receiptUrl;

    // Campos de reembolso (nuevos)
    @Column(precision = 10, scale = 2)
    private BigDecimal refundAmount;
    private String refundReason;
    private LocalDateTime refundedAt;

    // Stripe específico
    private String stripeSessionId;
    private String stripePaymentIntentId;
}
```

**Paso 2:** Crear los enums:
```java
public enum PaymentMethod { STRIPE, PAYPAL }
public enum PaymentStatus { PENDING, PROCESSING, COMPLETED, FAILED, REFUNDED, PARTIALLY_REFUNDED }
```
******************************************************************************************************************
**Paso 3:** Corregir `StripeEventProcessed`:
```java
@Entity
@Table(name = "stripe_events")
public class StripeEventProcessed {
    @Id
    private String id;  // Quitar @GeneratedValue, usar el event ID de Stripe directamente

    private Instant processedAt;
}
```

### 1.4 Corregir entidades — micro-realtime

**Paso 1:** Crear `DeliveryAddress` (Embeddable):
```java
@Embeddable
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class DeliveryAddress {
    private String street;
    private String colonia;
    private String city;
    private String postalCode;
    private String reference;   // "Casa azul, portón negro"
}
```

**Paso 2:** Actualizar `Order.java`:
```java
@Entity
@Table(name = "orders", indexes = {
    @Index(name = "idx_orders_customer_status", columnList = "customerId, status"),
    @Index(name = "idx_orders_driver_status", columnList = "driverId, status"),
    @Index(name = "idx_orders_created", columnList = "createdAt")
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Order extends BaseEntity {

    private Long customerId;
    private String customerName;    // Denormalizado (historial)
    private String customerEmail;   // Denormalizado (historial)

    private Long driverId;

    @Enumerated(EnumType.STRING)
    private OrderStatus status = OrderStatus.CREATED;

    @Embedded
    private DeliveryAddress deliveryAddress;

    private Double deliveryLatitude;
    private Double deliveryLongitude;

    @Column(precision = 10, scale = 2)
    private BigDecimal subtotal;

    @Column(precision = 10, scale = 2)
    private BigDecimal deliveryFee;

    @Column(precision = 10, scale = 2)
    private BigDecimal discount = BigDecimal.ZERO;

    @Column(precision = 10, scale = 2)
    private BigDecimal tip = BigDecimal.ZERO;

    @Column(precision = 10, scale = 2)
    private BigDecimal total;

    private String paymentMethod;   // "stripe" | "paypal"
    private String notes;

    private Integer rating;         // 1-5
    private String feedback;
    private LocalDateTime ratedAt;
    private LocalDateTime deliveredAt;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<OrderItem> items = new ArrayList<>();

    // Relación con Delivery (mismo servicio)
    @OneToOne(mappedBy = "order", cascade = CascadeType.ALL)
    private Delivery delivery;
}
```

**Paso 3:** Crear `OrderItem.java` (reemplazar @ElementCollection):
```java
@Entity
@Table(name = "order_items", indexes = {
    @Index(name = "idx_order_items_order", columnList = "order_id")
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class OrderItem extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    private Long productId;
    private String productName;     // Denormalizado (precio al momento del pedido)
    private String productImage;

    @Column(precision = 10, scale = 2)
    private BigDecimal unitPrice;

    private Integer quantity;

    @Column(precision = 10, scale = 2)
    private BigDecimal subtotal;
}
```

**Paso 4:** Actualizar `Delivery.java` (agregar relación JPA con Order):
```java
@Entity
@Table(name = "deliveries")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Delivery extends BaseEntity {

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false, unique = true)
    private Order order;

    private Long driverId;

    private LocalDateTime assignedAt;
    private LocalDateTime startedAt;
    private LocalDateTime completedAt;

    private Double pickupLatitude;
    private Double pickupLongitude;
    private Double deliveryLatitude;
    private Double deliveryLongitude;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Enumerated(EnumType.STRING)
    private DeliveryStatus status;
}
```

**Paso 5:** Crear `OrderEvent.java` (Event Sourcing):
```java
@Entity
@Table(name = "order_events", indexes = {
    @Index(name = "idx_events_order", columnList = "orderId"),
    @Index(name = "idx_events_occurred", columnList = "occurredAt")
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class OrderEvent {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long orderId;

    @Enumerated(EnumType.STRING)
    private OrderEventType eventType;

    @Column(columnDefinition = "TEXT")
    private String payload;     // JSON con datos del evento

    private String triggeredBy;     // userId o "SYSTEM"
    private LocalDateTime occurredAt;
}

public enum OrderEventType {
    CREATED, INVENTORY_RESERVED, INVENTORY_RELEASED,
    PAYMENT_PROCESSING, PAYMENT_COMPLETED, PAYMENT_FAILED,
    DRIVER_ASSIGNED, PREPARING, PICKED_UP,
    ON_THE_WAY, DELIVERED, CANCELLED, REFUNDED,
    RATED, FEEDBACK_ADDED
}
```

___________________------

### 1.5 Crear entidades nuevas — micro-productos

**Paso 1:** Crear `StockReservation.java`:
```java
@Entity
@Table(name = "stock_reservations", indexes = {
    @Index(name = "idx_reservation_order", columnList = "orderId, status")
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class StockReservation extends BaseEntity {

    private Long orderId;
    private Long productId;
    private Integer quantity;

    @Enumerated(EnumType.STRING)
    private ReservationStatus status = ReservationStatus.RESERVED;

    private LocalDateTime expiresAt;    // Auto-liberar si no se confirma
}

public enum ReservationStatus { RESERVED, CONFIRMED, RELEASED, EXPIRED }
```

**Paso 3:** Crear `DeliveryZone.java`:
```java
@Entity
@Table(name = "delivery_zones")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class DeliveryZone extends BaseEntity {

    @Column(nullable = false)
    private String name;           // "Zona Centro", "Zona Norte"

    private Double centerLatitude;
    private Double centerLongitude;
    private Double radiusKm;

    @Column(precision = 10, scale = 2)
    private BigDecimal deliveryFee;

    private Integer estimatedMinutes;
    private boolean active = true;
}
```

**Paso 2:** Mejorar `Menu.java`:
```java
@Entity
@Table(name = "menus")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Menu extends BaseEntity {

    private String name;
    private String description;
    private boolean active = true;

    @Enumerated(EnumType.STRING)
    private MenuType type;          // DESAYUNO, ALMUERZO, CENA, HAPPY_HOUR, ESPECIAL

    private LocalTime availableFrom;
    private LocalTime availableUntil;

    @ElementCollection
    @Enumerated(EnumType.STRING)
    private Set<DayOfWeek> availableDays;

    @OneToMany(mappedBy = "menu", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Product> products = new ArrayList<>();
}

public enum MenuType { DESAYUNO, ALMUERZO, CENA, HAPPY_HOUR, ESPECIAL }
```
_____________________________________________________________

### 1.6 Separar BD por microservicio

**Paso 1:** Crear un script de inicialización para Postgres. Crea `backend-delivery/init-databases.sql`:

```sql
-- Crear bases de datos separadas por microservicio
CREATE DATABASE customer_db;
CREATE DATABASE drivers_db;
CREATE DATABASE products_db;
CREATE DATABASE payments_db;
CREATE DATABASE orders_db;
CREATE DATABASE keycloak_db;
CREATE DATABASE users_db;

-- Crear usuarios con permisos limitados (opcional pero recomendado)
CREATE USER customer_user WITH PASSWORD 'customer_pass';
GRANT ALL PRIVILEGES ON DATABASE customer_db TO customer_user;

CREATE USER drivers_user WITH PASSWORD 'drivers_pass';
GRANT ALL PRIVILEGES ON DATABASE drivers_db TO drivers_user;

-- ... repetir para cada servicio
```

**Paso 2:** Actualizar el `application.yml` de cada microservicio:

```yaml
# micro-customer/src/main/resources/application.yml
spring:
  datasource:
    url: jdbc:postgresql://${POSTGRES_HOST:localhost}:${POSTGRES_PORT:5432}/customer_db
    username: ${POSTGRES_USER:ceiba_admin}
    password: ${POSTGRES_PASSWORD:password}
  jpa:
    hibernate:
      ddl-auto: validate    # En prod, usar validate + Flyway
    show-sql: false
    properties:
      hibernate:
        dialect: org.hibernate.dialect.PostgreSQLDialect
```

**Paso 3:** Montar el script en Docker Compose:
```yaml
postgres:
  image: postgres:16
  volumes:
    - postgres_data:/var/lib/postgresql/data
    - ./init-databases.sql:/docker-entrypoint-initdb.d/01-init.sql  # Auto-ejecuta al crear
```

### 1.7 Agregar Flyway para migraciones

**Paso 1:** Agregar dependencia a cada microservicio (`pom.xml`):

```xml
<dependency>
    <groupId>org.flywaydb</groupId>
    <artifactId>flyway-core</artifactId>
</dependency>
<dependency>
    <groupId>org.flywaydb</groupId>
    <artifactId>flyway-database-postgresql</artifactId>
</dependency>
```

**Paso 2:** Crear la primera migración en cada servicio:

```
# Ejemplo para micro-customer:
micro-customer/src/main/resources/db/migration/V1__create_customers_and_addresses.sql
```

```sql
-- V1__create_customers_and_addresses.sql

CREATE TABLE customers (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE,
    user_email VARCHAR(255) UNIQUE,
    total_orders INTEGER DEFAULT 0,
    total_spent DOUBLE PRECISION DEFAULT 0.0,
    member_since TIMESTAMP,
    last_order_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE addresses (
    id BIGSERIAL PRIMARY KEY,
    alias VARCHAR(100),
    street VARCHAR(255) NOT NULL,
    colonia VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    delegacion VARCHAR(255) NOT NULL,
    postal_code VARCHAR(20) NOT NULL,
    instructions TEXT,
    is_default BOOLEAN DEFAULT FALSE,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de unión ManyToMany (un cliente puede tener varias direcciones,
-- una dirección puede pertenecer a varios clientes)
CREATE TABLE customer_addresses (
    customer_id BIGINT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    address_id BIGINT NOT NULL REFERENCES addresses(id) ON DELETE CASCADE,
    PRIMARY KEY (customer_id, address_id)
);

CREATE INDEX idx_customers_email ON customers(user_email);
CREATE INDEX idx_customer_addresses_customer ON customer_addresses(customer_id);
CREATE INDEX idx_customer_addresses_address ON customer_addresses(address_id);
```

**Paso 3:** Configurar Flyway en `application.yml`:

```yaml
spring:
  flyway:
    enabled: true
    locations: classpath:db/migration
    baseline-on-migrate: true
  jpa:
    hibernate:
      ddl-auto: validate   # Flyway maneja el schema, Hibernate solo valida
```

### ✅ Verificación Fase 1
- [ ] `BaseEntity` creada en cada microservicio
- [ ] Customer↔Address con @ManyToMany y tabla `customer_addresses`
- [ ] Payment corregido (BigDecimal, tipos de datos, campos de refund)
- [ ] Order mejorado con DeliveryAddress embeddable y OrderItem como entidad
- [ ] OrderEvent creado para Event Sourcing
- [ ] StockReservation y DeliveryZone creados
- [ ] Menu mejorado con horarios
- [ ] BD separadas por microservicio (init-databases.sql)
- [ ] Flyway configurado con primera migración
- [ ] `mvn compile` pasa en cada microservicio
- [ ] Commit: `git commit -m "feat: corregir entidades, nuevas entidades, BD por servicio, Flyway"`

---

## FASE 2 — Autenticación con Keycloak 🔴

> **Objetivo:** Reemplazar micro-auth por Keycloak. Login con Google.
> **Tiempo estimado:** 2-3 días
> **Prerequisito:** Fase 1

### 2.1 Agregar Keycloak al Docker Compose

```yaml
# En docker-compose.dev.yml
keycloak-db:
  image: postgres:16-alpine
  environment:
    POSTGRES_DB: keycloak_db
    POSTGRES_USER: keycloak
    POSTGRES_PASSWORD: ${KEYCLOAK_DB_PASSWORD}
  volumes:
    - keycloak_db_data:/var/lib/postgresql/data

keycloak:
  image: quay.io/keycloak/keycloak:25.0
  command: start-dev
  environment:
    KC_DB: postgres
    KC_DB_URL: jdbc:postgresql://keycloak-db:5432/keycloak_db
    KC_DB_USERNAME: keycloak
    KC_DB_PASSWORD: ${KEYCLOAK_DB_PASSWORD}
    KEYCLOAK_ADMIN: ${KEYCLOAK_ADMIN}
    KEYCLOAK_ADMIN_PASSWORD: ${KEYCLOAK_ADMIN_PASSWORD}
  ports:
    - "8080:8080"
  depends_on:
    - keycloak-db
```

### 2.2 Configurar Keycloak (manual en la UI)

1. Abrir http://localhost:8080 → Admin Console → Login con admin/password
2. **Crear Realm:** `ceiba-bar`
3. **Crear Clients:**
   - `ceiba-frontend-angular` (Public client, redirect: `http://localhost:4200/*`)
   - `ceiba-frontend-react` (Public client, redirect: `http://localhost:3000/*`)
   - `ceiba-gateway` (Confidential client, service account)
4. **Crear Roles de Realm:** `ADMIN`, `CUSTOMER`, `DRIVER`, `RESTAURANT`
5. **Crear usuarios de prueba** con diferentes roles

### 2.3 Configurar microservicios como Resource Servers

**Paso 1:** Agregar dependencia a cada microservicio:

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-oauth2-resource-server</artifactId>
</dependency>
```

**Paso 2:** Configurar `application.yml`:

```yaml
spring:
  security:
    oauth2:
      resourceserver:
        jwt:
          issuer-uri: http://keycloak:8080/realms/ceiba-bar
          jwk-set-uri: http://keycloak:8080/realms/ceiba-bar/protocol/openid-connect/certs
```

**Paso 3:** Crear `SecurityConfig.java`:

```java
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/actuator/**").permitAll()
                .requestMatchers("/api/v1/products/**").permitAll()   // Público
                .requestMatchers("/api/v1/admin/**").hasRole("ADMIN")
                .anyRequest().authenticated()
            )
            .oauth2ResourceServer(oauth2 -> oauth2
                .jwt(jwt -> jwt.jwtAuthenticationConverter(keycloakJwtConverter()))
            );
        return http.build();
    }

    private JwtAuthenticationConverter keycloakJwtConverter() {
        JwtAuthenticationConverter converter = new JwtAuthenticationConverter();
        converter.setJwtGrantedAuthoritiesConverter(jwt -> {
            Map<String, Object> realmAccess = jwt.getClaim("realm_access");
            List<String> roles = (List<String>) realmAccess.get("roles");
            return roles.stream()
                .map(role -> new SimpleGrantedAuthority("ROLE_" + role))
                .collect(Collectors.toList());
        });
        return converter;
    }
}
```

### 2.4 Exportar configuración de Keycloak

```bash
# Exportar realm para versionado en Git
docker exec keycloak /opt/keycloak/bin/kc.sh export \
  --dir /opt/keycloak/data/export \
  --realm ceiba-bar

# Copiar al proyecto
docker cp keycloak:/opt/keycloak/data/export/ceiba-bar-realm.json \
  ./backend-delivery/keycloak/ceiba-bar-realm.json
```

### 2.5 (Opcional) Configurar Identity Brokering con Google
Si deseas habilitar inicio de sesión social con Google más adelante:
1. Ir a Google Cloud Console, crear un proyecto y generar credenciales de cliente OAuth 2.0 (obteniendo Client ID y Client Secret).
2. En Keycloak Admin Console, ir a **Identity providers** -> **Add provider** -> **Google**.
3. Pegar el Client ID y Client Secret.

### ✅ Verificación Fase 2
- [ ] Keycloak corre en Docker y la UI es accesible
- [ ] Realm `ceiba-bar` creado con roles y clientes
- [ ] (Opcional) Login con Google funciona (si se configuró el broker)
- [ ] Microservicios validan JWT de Keycloak
- [ ] Un request sin token → 401
- [ ] Un request con token → 200
- [ ] Realm exportado a JSON en el repo
- [ ] Commit: `git commit -m "feat: integrar Keycloak, OAuth2 Resource Server, login Google"`

---

## FASE 3 — Lógica de Negocio (Patrones) 🔴

> **Objetivo:** Implementar los patrones de diseño core del negocio.
> **Tiempo estimado:** 5-7 días
> **Prerequisito:** Fase 2

### 3.1 Strategy Pattern — Pagos (2 días)

1. Crear interfaz `PaymentGateway`
2. Implementar `StripeGateway` (con Stripe Java SDK)
3. Implementar `PayPalGateway` (con PayPal Java SDK)
4. Crear `PaymentService` que inyecta ambos
5. Configurar webhooks (endpoint público que recibe callbacks)
6. Implementar idempotency keys
7. **Probar:** Crear un pago con Stripe test keys → verificar webhook → pago confirmado

### 3.2 State Pattern — Órdenes (1-2 días)

1. Crear interfaz `OrderState` con métodos `next()`, `cancel()`, `getStateName()`
2. Implementar cada estado: `PendingState`, `PaidState`, `PreparingState`, `OnTheWayState`, `DeliveredState`, `CancelledState`
3. Crear `OrderContext` que mantiene el estado actual
4. **Probar:** Una orden debe pasar por PENDING → PAID → PREPARING → ON_THE_WAY → DELIVERED

### 3.3 Saga por Coreografía + Outbox Pattern — Flujo de pedido (3-4 días)

> **Este es el patrón más complejo del proyecto. Tómate tu tiempo.**

**Día 1: Infraestructura RabbitMQ**
1. Configurar RabbitMQ exchange `exchange.saga` (tipo: topic)
2. Crear las queues:
   - `queue.order.created` (binding: `ORDEN_CREADA`)
   - `queue.stock.reserved` (binding: `STOCK_RESERVED`)
   - `queue.stock.failed` (binding: `STOCK_RESERVATION_FAILED`)
   - `queue.payment.ok` (binding: `PAYMENT_OK`)
   - `queue.payment.failed` (binding: `PAYMENT_FAILED`)
   - `queue.driver.assigned` (binding: `DRIVER_ASSIGNED`)
   - `queue.driver.unavailable` (binding: `DRIVER_NOT_AVAILABLE`)
3. Configurar Dead Letter Exchange `exchange.saga.dlx` → `queue.saga.dlq`
4. Crear clase de configuración `RabbitConfig.java` con todos los beans

**Día 2: Outbox Pattern (entidad + poller)**
1. Crear entidad `OutboxEvent` en cada microservicio que publique eventos:
   ```java
   @Entity
   @Table(name = "outbox_events", indexes = {
       @Index(name = "idx_outbox_status", columnList = "status, createdAt")
   })
   public class OutboxEvent {
       @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
       private Long id;
       private String aggregateType;   // "Order", "Payment", "Product"
       private Long aggregateId;
       private String eventType;       // "ORDEN_CREADA", "STOCK_RESERVED", etc.
       @Column(columnDefinition = "TEXT")
       private String payload;         // JSON
       @Enumerated(EnumType.STRING)
       private OutboxStatus status;    // PENDING, SENT, FAILED
       private LocalDateTime createdAt;
       private LocalDateTime sentAt;
       private Integer retryCount = 0;
   }
   ```
2. Crear `OutboxRepository`
3. Crear `OutboxPoller` con `@Scheduled(fixedDelay = 1000)` que:
   - Lee eventos con status=PENDING
   - Publica a RabbitMQ
   - Marca como SENT
   - Si falla 5 veces → marca como FAILED
4. Agregar migración Flyway `V2__create_outbox_table.sql` en cada servicio
5. **Probar:** Guardar un OutboxEvent manualmente → verificar que el poller lo publica

**Día 3: Flujo Saga completo**
1. `micro-realtime` — `OrderService.createOrder()`:
   - Guardar orden en BD + OutboxEvent `ORDEN_CREADA` en misma @Transactional
2. `micro-productos` — `ProductSagaListener`:
   - `@RabbitListener(queue.order.created)` → reservar stock → OutboxEvent `STOCK_RESERVED`
   - Si no hay stock → OutboxEvent `STOCK_RESERVATION_FAILED`
3. `micro-payments` — `PaymentSagaListener`:
   - `@RabbitListener(queue.stock.reserved)` → cobrar con Stripe/PayPal → OutboxEvent `PAYMENT_OK`
   - Si falla → OutboxEvent `PAYMENT_FAILED`
4. `micro-drivers` — `DriverSagaListener`:
   - `@RabbitListener(queue.payment.ok)` → asignar conductor → OutboxEvent `DRIVER_ASSIGNED`
   - Si no hay conductor → OutboxEvent `DRIVER_NOT_AVAILABLE`

**Día 4: Compensaciones**
1. `micro-productos` escucha `PAYMENT_FAILED` → liberar stock reservado
2. `micro-realtime` escucha `PAYMENT_FAILED` y `STOCK_RESERVATION_FAILED` → cancelar orden
3. `micro-payments` escucha `DRIVER_NOT_AVAILABLE` → reembolsar pago
4. **Probar el flujo completo:**
   - Happy path: crear pedido → stock reservado → pago OK → conductor asignado
   - Fallo pago: crear pedido → stock reservado → pago FALLA → stock liberado → orden cancelada
   - Sin stock: crear pedido → stock FALLA → orden cancelada
   - Sin conductor: crear pedido → ... → conductor NO disponible → reembolso → orden cancelada

### 3.4 Cache con Redis (1 día)

1. Agregar Redis al Docker Compose
2. Agregar dependencia `spring-boot-starter-data-redis` a micro-productos
3. Cachear catálogo de productos con `@Cacheable`
4. Invalidar caché cuando un producto cambie (listener RabbitMQ)

### 3.5 Asignación de conductores — Strategy (0.5 días)

1. Crear interfaz `DriverAssignmentStrategy`
2. Implementar `NearestDriverStrategy` (usando fórmula Haversine)
3. Configurar en `micro-drivers`
4. **Probar:** Dado un pedido en lat/lng X, se asigna el conductor disponible más cercano

### ✅ Verificación Fase 3
- [ ] Pago con Stripe (sandbox) funciona end-to-end
- [ ] Orden transiciona correctamente por estados
- [ ] Outbox Pattern: evento se guarda en misma transacción y poller lo publica
- [ ] Saga completa: crear pedido → reservar stock → cobrar → asignar conductor
- [ ] Compensación: pago falla → stock liberado, orden cancelada
- [ ] Compensación: sin conductor → reembolso, orden cancelada
- [ ] Redis cachea productos y el caché se invalida al actualizar
- [ ] DLQ recoge mensajes fallidos (verificar en RabbitMQ Management UI)
- [ ] Commit: `git commit -m "feat: Strategy pagos, State órdenes, Saga+Outbox, Redis cache"`

---

## FASE 4 — Frontends 🔴

> **Objetivo:** Crear las dos versiones del frontend: Angular y Next.js.
> **Tiempo estimado:** 7-10 días (3-5 por frontend)
> **Prerequisito:** Fase 3

### 4.1 Frontend Angular — Setup (1 día)

```bash
# Crear proyecto Angular 19
cd frontend-angular
npx -y @angular/cli@19 new ceiba-bar --routing --style=scss --standalone

# Instalar dependencias
cd ceiba-bar
npm install primeng primeicons @primeng/themes
npm install leaflet @types/leaflet
npm install keycloak-angular keycloak-js
npm install @stripe/stripe-js
npm install socket.io-client
npm install @ngx-translate/core @ngx-translate/http-loader
```

### 4.2 Frontend Angular — Páginas (3-4 días)

Implementar en este orden:
1. **Layout** — Header, Footer, Sidebar, tema PrimeNG
2. **Home** — Landing con productos destacados
3. **Menú** — Grid de productos con filtros por categoría
4. **Carrito** — Agregar/quitar productos, dirección
5. **Checkout** — Stripe Elements + PayPal Smart Buttons
6. **Tracking** — Mapa Leaflet con posición del conductor en tiempo real (WebSocket)
7. **Mis Pedidos** — Historial con estados
8. **Perfil** — Datos, direcciones, preferencias
9. **Admin Dashboard** — CRUD productos, ver pedidos, gestionar conductores
10. **Auth Guard** — Proteger rutas con Keycloak

### 4.3 Frontend Next.js — Setup (1 día)

```bash
# Crear proyecto Next.js 15
cd frontend-nextjs
npx -y create-next-app@latest ceiba-bar --typescript --tailwind --eslint --app --src-dir

# Instalar dependencias
cd ceiba-bar
npx shadcn@latest init
npx shadcn@latest add button card input dialog toast sheet
npm install zustand @tanstack/react-query
npm install leaflet react-leaflet @types/leaflet
npm install @stripe/stripe-js @stripe/react-stripe-js
npm install socket.io-client
npm install next-intl
npm install next-auth @auth/core
npm install framer-motion
```

### 4.4 Frontend Next.js — Páginas (3-4 días)

Mismo orden que Angular:
1. **Layout** (app/layout.tsx) — Header, Footer, Providers (Query, Auth, Theme)
2. **Home** (app/page.tsx) — Landing con SSR
3. **Menú** (app/menu/page.tsx) — Productos con filtros
4. **Carrito** — Zustand store + página
5. **Checkout** — Stripe + PayPal
6. **Tracking** (app/tracking/[orderId]/page.tsx) — Mapa con WebSocket
7. **Pedidos** (app/orders/page.tsx) — Historial
8. **Perfil** (app/profile/page.tsx)
9. **Admin** (app/admin/...) — Dashboard protegido por rol
10. **Middleware** — next-auth para proteger rutas

### 4.5 Componentes compartidos (ambos frontends)

Ambos frontends necesitan estos componentes:
- **ProductCard** — Tarjeta de producto con imagen, precio, botón agregar
- **CartSummary** — Resumen del carrito con totales
- **PaymentSelector** — Toggle entre Stripe y PayPal
- **MapTracker** — Mapa Leaflet con marcadores animados
- **OrderStatusBadge** — Badge con color según estado
- **SkeletonLoader** — Placeholder mientras carga
- **ToastNotification** — Notificación en tiempo real

### ✅ Verificación Fase 4
- [ ] Angular: `ng serve` funciona, todas las páginas navegan
- [ ] Next.js: `npm run dev` funciona, todas las páginas navegan
- [ ] Ambos: Login con Keycloak funciona
- [ ] Ambos: Carrito persiste en estado global
- [ ] Ambos: Checkout con Stripe/PayPal (sandbox)
- [ ] Ambos: Tracking muestra mapa con posición simulada
- [ ] Ambos: Responsive en móvil y desktop
- [ ] Ambos: Dark mode toggle funciona
- [ ] Commit: `git commit -m "feat: frontend Angular + frontend Next.js completos"`

---

## FASE 5 — Docker Compose Completo 🔴

> **Objetivo:** Dockerizar todo (backend + ambos frontends) y levantar con un comando.
> **Tiempo estimado:** 2-3 días
> **Prerequisito:** Fase 4

### 5.1 Crear Dockerfiles Multi-Stage

**Para cada microservicio backend:**

```dockerfile
# backend-delivery/micro-customer/Dockerfile
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline -B
COPY src ./src
RUN mvn package -DskipTests -B

FROM eclipse-temurin:21-jre-alpine
RUN addgroup -S app && adduser -S app -G app
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
USER app
EXPOSE 8088
HEALTHCHECK --interval=30s --timeout=3s \
  CMD wget -qO- http://localhost:8088/actuator/health || exit 1
ENTRYPOINT ["java", "-Xmx256m", "-jar", "app.jar"]
```

**Para Frontend Angular:**

```dockerfile
# frontend-angular/Dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build -- --configuration production

FROM nginx:alpine
COPY --from=build /app/dist/ceiba-bar/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

**Para Frontend Next.js:**

```dockerfile
# frontend-nextjs/Dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM node:20-alpine
WORKDIR /app
RUN addgroup -S app && adduser -S app -G app
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public
USER app
EXPOSE 3000
ENV NODE_ENV=production
CMD ["node", "server.js"]
```

### 5.2 Crear `docker-compose.dev.yml`

```yaml
# backend-delivery/docker-compose.dev.yml
version: '3.8'

services:
  # ============= INFRAESTRUCTURA =============
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init-databases.sql:/docker-entrypoint-initdb.d/01-init.sql
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER}"]
      interval: 10s
      timeout: 5s
      retries: 5

  mongodb:
    image: mongo:7
    environment:
      MONGO_INITDB_ROOT_USERNAME: ${MONGO_INITDB_ROOT_USERNAME}
      MONGO_INITDB_ROOT_PASSWORD: ${MONGO_INITDB_ROOT_PASSWORD}
    volumes:
      - mongo_data:/data/db
    ports:
      - "27017:27017"
    healthcheck:
      test: echo 'db.runCommand("ping").ok' | mongosh --quiet
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    command: redis-server --requirepass ${REDIS_PASSWORD}
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "-a", "${REDIS_PASSWORD}", "ping"]
      interval: 10s
      timeout: 5s

  rabbitmq:
    image: rabbitmq:3-management-alpine
    environment:
      RABBITMQ_DEFAULT_USER: ${RABBITMQ_DEFAULT_USER}
      RABBITMQ_DEFAULT_PASS: ${RABBITMQ_DEFAULT_PASS}
    ports:
      - "5672:5672"
      - "15672:15672"   # Management UI
    healthcheck:
      test: ["CMD", "rabbitmq-diagnostics", "-q", "ping"]
      interval: 10s
      timeout: 5s

  zookeeper:
    image: confluentinc/cp-zookeeper:7.5.0
    environment:
      ZOOKEEPER_CLIENT_PORT: 2181
    healthcheck:
      test: echo ruok | nc localhost 2181
      interval: 10s
      timeout: 5s

  kafka:
    image: confluentinc/cp-kafka:7.5.0
    depends_on:
      zookeeper:
        condition: service_healthy
    environment:
      KAFKA_BROKER_ID: 1
      KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://kafka:9092
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1
    healthcheck:
      test: kafka-topics --bootstrap-server localhost:9092 --list
      interval: 15s
      timeout: 10s
      retries: 5

  minio:
    image: minio/minio
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: ${MINIO_ROOT_USER}
      MINIO_ROOT_PASSWORD: ${MINIO_ROOT_PASSWORD}
    ports:
      - "9000:9000"
      - "9001:9001"   # MinIO Console
    volumes:
      - minio_data:/data

  # ============= AUTH =============
  keycloak-db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: keycloak_db
      POSTGRES_USER: keycloak
      POSTGRES_PASSWORD: ${KEYCLOAK_DB_PASSWORD}
    volumes:
      - keycloak_db_data:/var/lib/postgresql/data

  keycloak:
    image: quay.io/keycloak/keycloak:25.0
    command: start-dev --import-realm
    environment:
      KC_DB: postgres
      KC_DB_URL: jdbc:postgresql://keycloak-db:5432/keycloak_db
      KC_DB_USERNAME: keycloak
      KC_DB_PASSWORD: ${KEYCLOAK_DB_PASSWORD}
      KEYCLOAK_ADMIN: ${KEYCLOAK_ADMIN}
      KEYCLOAK_ADMIN_PASSWORD: ${KEYCLOAK_ADMIN_PASSWORD}
    volumes:
      - ./keycloak/ceiba-bar-realm.json:/opt/keycloak/data/import/ceiba-bar-realm.json
    ports:
      - "8080:8080"
    depends_on:
      - keycloak-db

  # ============= MICROSERVICIOS =============
  eureka:
    build: ./eureka
    ports:
      - "8762:8762"
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost:8762/actuator/health"]
      interval: 15s
      timeout: 5s

  gateway:
    build: ./micro-gateway
    ports:
      - "8090:8090"
    environment:
      - SPRING_PROFILES_ACTIVE=dev
    depends_on:
      eureka:
        condition: service_healthy
      keycloak:
        condition: service_started

  micro-customer:
    build: ./micro_customer
    environment:
      - SPRING_PROFILES_ACTIVE=dev
      - SPRING_DATASOURCE_URL=jdbc:postgresql://postgres:5432/customer_db
    depends_on:
      postgres:
        condition: service_healthy
      eureka:
        condition: service_healthy

  micro-drivers:
    build: ./micro_drivers
    environment:
      - SPRING_PROFILES_ACTIVE=dev
      - SPRING_DATASOURCE_URL=jdbc:postgresql://postgres:5432/drivers_db
    depends_on:
      postgres:
        condition: service_healthy
      eureka:
        condition: service_healthy

  micro-productos:
    build: ./micro_productos
    environment:
      - SPRING_PROFILES_ACTIVE=dev
      - SPRING_DATASOURCE_URL=jdbc:postgresql://postgres:5432/products_db
    depends_on:
      postgres:
        condition: service_healthy
      eureka:
        condition: service_healthy
      redis:
        condition: service_healthy

  micro-payments:
    build: ./micro_payments
    environment:
      - SPRING_PROFILES_ACTIVE=dev
      - SPRING_DATASOURCE_URL=jdbc:postgresql://postgres:5432/payments_db
      - STRIPE_SECRET_KEY=${STRIPE_SECRET_KEY}
    depends_on:
      postgres:
        condition: service_healthy
      eureka:
        condition: service_healthy
      rabbitmq:
        condition: service_healthy

  micro-realtime:
    build: ./micro-realtime
    environment:
      - SPRING_PROFILES_ACTIVE=dev
      - SPRING_DATASOURCE_URL=jdbc:postgresql://postgres:5432/orders_db
    depends_on:
      postgres:
        condition: service_healthy
      mongodb:
        condition: service_healthy
      eureka:
        condition: service_healthy
      kafka:
        condition: service_healthy
      rabbitmq:
        condition: service_healthy

  micro-notifications:
    build: ./micro-notifications
    environment:
      - SPRING_PROFILES_ACTIVE=dev
    depends_on:
      mongodb:
        condition: service_healthy
      rabbitmq:
        condition: service_healthy

  # ============= FRONTENDS =============
  frontend-angular:
    build: ../frontend-angular
    ports:
      - "4200:80"

  frontend-nextjs:
    build: ../frontend-nextjs
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production

  # ============= MONITOREO =============
  prometheus:
    image: prom/prometheus
    volumes:
      - ./prometheus/prometheus.yml:/etc/prometheus/prometheus.yml
    ports:
      - "9090:9090"

  grafana:
    image: grafana/grafana
    ports:
      - "3001:3000"
    volumes:
      - grafana_data:/var/lib/grafana

volumes:
  postgres_data:
  mongo_data:
  keycloak_db_data:
  minio_data:
  grafana_data:

networks:
  default:
    name: ceiba-network
```

### 5.3 Levantar y probar

```bash
# Construir y levantar todo
cd backend-delivery
docker compose -f docker-compose.dev.yml up --build -d

# Ver logs
docker compose -f docker-compose.dev.yml logs -f gateway

# Verificar todos los servicios
docker compose -f docker-compose.dev.yml ps

# Probar endpoints
curl http://localhost:8090/api/v1/products    # Via Gateway
curl http://localhost:4200                    # Angular
curl http://localhost:3000                    # Next.js
```

### ✅ Verificación Fase 5
- [ ] `docker compose up --build -d` levanta TODOS los servicios sin errores
- [ ] Todos los healthchecks pasan (docker compose ps muestra "healthy")
- [ ] Frontend Angular accesible en localhost:4200
- [ ] Frontend Next.js accesible en localhost:3000
- [ ] API accesible via Gateway en localhost:8090
- [ ] Keycloak accesible en localhost:8080
- [ ] RabbitMQ Management accesible en localhost:15672
- [ ] Grafana accesible en localhost:3001
- [ ] Las imágenes son < 200MB (verificar con `docker images`)
- [ ] Commit: `git commit -m "feat: Docker Compose completo con todos los servicios"`

---

## FASE 6 — Kubernetes con Minikube 🟡

> **Objetivo:** Desplegar el mismo proyecto en Kubernetes local para aprender K8s.
> **Tiempo estimado:** 2-3 días
> **Prerequisito:** Fase 5

### 6.1 Instalar Minikube y kubectl

```powershell
# Con Chocolatey (Windows)
choco install minikube kubernetes-cli kubernetes-helm

# Iniciar cluster
minikube start --cpus=4 --memory=8192 --driver=docker
minikube addons enable ingress
minikube addons enable metrics-server
minikube addons enable dashboard
```

### 6.2 Construir imágenes dentro de Minikube

```bash
# Usar el Docker daemon de Minikube
eval $(minikube docker-env)        # Linux/Mac
minikube docker-env --shell powershell | Invoke-Expression  # Windows

# Construir las imágenes
cd backend-delivery
docker build -t ceiba/gateway:latest ./micro-gateway
docker build -t ceiba/customer:latest ./micro_customer
docker build -t ceiba/drivers:latest ./micro_drivers
docker build -t ceiba/productos:latest ./micro_productos
docker build -t ceiba/payments:latest ./micro_payments
docker build -t ceiba/realtime:latest ./micro-realtime
docker build -t ceiba/notifications:latest ./micro-notifications
docker build -t ceiba/eureka:latest ./eureka

cd ..
docker build -t ceiba/frontend-angular:latest ./frontend-angular
docker build -t ceiba/frontend-nextjs:latest ./frontend-nextjs
```

### 6.3 Crear manifiestos K8s

Crea los archivos en `k8s/base/`. Empieza por la infraestructura y luego los servicios.

**Orden de creación:**
1. `namespace.yaml`
2. `secrets/` (db-secrets.yaml, app-secrets.yaml)
3. `configmaps/`
4. `databases/` (postgres, mongodb, redis)
5. `messaging/` (rabbitmq, kafka)
6. `auth/` (keycloak)
7. `services/` (eureka, gateway, microservicios)
8. `frontend/` (angular, nextjs)
9. `monitoring/` (prometheus, grafana)
10. `ingress.yaml`

### 6.4 Aplicar y verificar

```bash
# Crear namespace
kubectl apply -f k8s/base/namespace.yaml

# Aplicar todo
kubectl apply -f k8s/base/ --recursive

# Verificar pods
kubectl get pods -n ceiba-bar -w     # -w para watch

# Ver logs de un pod
kubectl logs -f deployment/gateway -n ceiba-bar

# Acceder a la app
minikube service frontend-angular -n ceiba-bar --url

# Dashboard visual
minikube dashboard
```

### 6.5 Probar escalado

```bash
# Escalar el gateway a 3 réplicas
kubectl scale deployment gateway --replicas=3 -n ceiba-bar

# Verificar
kubectl get pods -n ceiba-bar -l app=gateway

# Ver distribución de carga
kubectl top pods -n ceiba-bar
```

### ✅ Verificación Fase 6
- [ ] Minikube corriendo con ingress habilitado
- [ ] Todos los pods en estado `Running`
- [ ] App accesible via Minikube URL
- [ ] Escalado funciona (múltiples réplicas del gateway)
- [ ] Dashboard de Minikube muestra todos los recursos
- [ ] Commit: `git commit -m "feat: manifiestos Kubernetes para despliegue en Minikube"`

---

## FASE 7 — Deploy en VPS (Producción) 🔴

> **Objetivo:** Desplegar tu app en un servidor real accesible desde Internet.
> **Tiempo estimado:** 1-2 días
> **Prerequisito:** Fase 5 (Docker Compose funcional)

### 7.1 Opción recomendada: Hetzner

1. **Crear cuenta** en https://www.hetzner.com/cloud
2. **Crear servidor:** CX32 (8GB, 4vCPU) → Ubuntu 24.04 → Agregar tu SSH key
3. **Conectar por SSH:**
   ```bash
   ssh root@TU_IP_PUBLICA
   ```
4. **Ejecutar script de setup:**
   ```bash
   # Descargar y ejecutar
   curl -fsSL https://raw.githubusercontent.com/tu-usuario/Ceiba-Bar/v2/scripts/setup-hetzner.sh | bash
   ```

### 7.2 Desplegar la app

```bash
# En el servidor, como usuario deploy
su - deploy

# Clonar el repo
git clone https://github.com/tu-usuario/Ceiba-Bar.git
cd Ceiba-Bar/backend-delivery

# Configurar variables de entorno
cp .env.example .env
nano .env   # Editar con valores reales de producción

# Construir y levantar
docker compose -f docker-compose.prod.yml up --build -d

# Verificar
docker compose -f docker-compose.prod.yml ps
```

### 7.3 Configurar SSL con Let's Encrypt

```bash
# Obtener certificado SSL (reemplaza con tu dominio)
certbot --nginx -d tudominio.com -d www.tudominio.com

# Verificar renovación automática
certbot renew --dry-run
```

### 7.4 Configurar CI/CD para deploy automático

Crea `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Hetzner

on:
  push:
    branches: [v2]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Deploy via SSH
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: deploy
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd ~/Ceiba-Bar
            git pull origin v2
            cd backend-delivery
            docker compose -f docker-compose.prod.yml pull
            docker compose -f docker-compose.prod.yml up -d --build
            docker system prune -f
```

### ✅ Verificación Fase 7
- [ ] Servidor creado en Hetzner (o AWS/Azure)
- [ ] App accesible desde Internet con HTTPS
- [ ] SSL con Let's Encrypt configurado
- [ ] CI/CD: push a `v2` → deploy automático
- [ ] Firewall solo permite puertos 22, 80, 443
- [ ] Commit: `git commit -m "feat: deploy en Hetzner con CI/CD y SSL"`

---

## FASE 8 — Polish y Extras 🟢

> **Objetivo:** Pulir, optimizar y agregar características que impresionen.
> **Tiempo estimado:** 3-5 días (continuo)
> **Prerequisito:** Fase 7

### 8.1 Observabilidad

- [ ] Configurar Prometheus para recolectar métricas de cada microservicio
- [ ] Crear dashboards en Grafana (requests/s, latencia, errores)
- [ ] Configurar alertas (servicio caído → email)
- [ ] Agregar tracing distribuido con Zipkin

### 8.2 Seguridad final

- [ ] Ejecutar `trivy image` en todas las imágenes Docker
- [ ] Ejecutar `mvn org.owasp:dependency-check-maven:check` en cada microservicio
- [ ] Ejecutar `npm audit` en cada frontend
- [ ] Verificar headers de seguridad con https://securityheaders.com
- [ ] Verificar SSL con https://www.ssllabs.com/ssltest/

### 8.3 Performance

- [ ] Agregar `spring.jpa.open-in-view: false` en todos los microservicios
- [ ] Implementar paginación en todos los endpoints de listado
- [ ] Optimizar queries N+1 con `@EntityGraph` o `JOIN FETCH`
- [ ] Comprimir respuestas HTTP (gzip en Nginx)
- [ ] Agregar caché HTTP (`Cache-Control` headers) para recursos estáticos

### 8.4 Documentación

- [ ] Configurar Swagger UI unificado en el Gateway
- [ ] Crear colección Postman con todos los endpoints
- [ ] Actualizar README.md con instrucciones de setup, screenshots, y arquitectura
- [ ] Agregar badges al README (build status, coverage, etc.)

### 8.5 Portfolio/CV

- [ ] Grabar un video demo de 2-3 minutos mostrando el flujo completo
- [ ] Tomar screenshots de: login, menú, checkout, tracking, admin
- [ ] Escribir un README.md que impresione:
  - Descripción del proyecto
  - Arquitectura (diagrama)
  - Stack tecnológico con logos
  - Screenshots/GIFs
  - Instrucciones de instalación
  - Patrones de diseño usados
  - Lecciones aprendidas

---

## 📊 RESUMEN DE TIEMPOS

| Fase | Nombre | Tiempo | Acumulado |
|------|--------|--------|-----------|
| 0 | Setup | 1 día | 1 día |
| 1 | BD & Entidades | 3-5 días | 4-6 días |
| 2 | Keycloak Auth | 2-3 días | 6-9 días |
| 3 | Lógica de Negocio | 6-8 días | 12-17 días |
| 4 | Frontends | 7-10 días | 18-26 días |
| 5 | Docker Compose | 2-3 días | 20-29 días |
| 6 | Kubernetes | 2-3 días | 22-32 días |
| 7 | Deploy VPS | 1-2 días | 23-34 días |
| 8 | Polish | 3-5 días | 26-39 días |

**Total: ~6-8 semanas** trabajando algunas horas diarias.

---

## 💡 TIPS GENERALES

1. **No te paralices.** Si algo no sale, salta al siguiente punto y vuelve después.
2. **Haz commits pequeños y frecuentes.** Un commit por feature o fix.
3. **Prueba después de cada cambio.** No acumules cambios sin probar.
4. **Usa branches para features grandes.** `v2/feat-payments`, `v2/feat-keycloak`, etc.
5. **Documenta mientras construyes.** Es más fácil ahora que después.
6. **Si te atascas más de 2 horas**, pide ayuda (IA, StackOverflow, Discord de Spring).
7. **El 80% del valor** viene de las Fases 1-5. K8s y deploy son bonus para el CV.

---

> 🎯 **Meta final:** Tener un proyecto que puedas mostrar en entrevistas y decir:
> "Diseñé y construí una plataforma de delivery con microservicios en Java 21,
> dos frontends (Angular + Next.js), patrones de diseño, Kubernetes,
> y desplegado en un VPS con CI/CD."
>
> Eso es **killer** para cualquier entrevista de backend/fullstack. 🚀
