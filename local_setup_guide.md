# ⚙️ Guía de Configuración y Ejecución Local — Ceiba-Bar Delivery v2

Esta guía contiene la información necesaria para compilar, configurar e iniciar el ecosistema de microservicios de **Ceiba-Bar Delivery** en tu máquina local de desarrollo.

---

## 🗺️ 1. Tabla Maestra de Puertos y Servicios

El sistema se compone de varios servicios que deben correr simultáneamente. Asegúrate de que los siguientes puertos estén libres en tu sistema operativo antes de comenzar:

| Componente | Puerto Local | Tipo de Acceso | Descripción / Propósito |
| :--- | :---: | :---: | :--- |
| **eureka** | `8761` | HTTP / Web | Servidor de Registro y Descubrimiento de Servicios (Eureka Dashboard). |
| **micro-gateway** | `8090` | HTTP / API | API Gateway. Único punto de entrada público para el Frontend. |
| **keycloak** | `8080` | HTTP / Web | Servidor de Identidad (IAM) y Autenticación (Keycloak Admin Console). |
| **micro_users** | `8081` | HTTP / Interno | Servicio de gestión y sincronización de usuarios. |
| **micro-customer** | `8082` | HTTP / Interno | Servicio de clientes, direcciones y estadísticas de compra. |
| **micro-drivers** | `8083` | HTTP / Interno | Servicio de repartidores, colas de asignación y disponibilidad. |
| **micro_products** | `8084` | HTTP / Interno | Servicio de catálogo de productos, menús y reserva de stock. |
| **micro_payments** | `8085` | HTTP / Interno | Servicio de integración de cobros (Stripe y PayPal). |
| **micro-realtime** | `8086` | HTTP / WS / WebFlux | Servicio reactivo de órdenes, entregas y streaming GPS por WebSockets. |
| **PostgreSQL** | `5432` | TCP / BD | Servidor de base de datos relacional (múltiples DBs lógicas). |
| **MongoDB** | `27017` | TCP / BD | Base de datos documental NoSQL para almacenamiento del tracking GPS. |
| **Redis** | `6379` | TCP / Cache | Almacenamiento en memoria para caché de catálogo y locks distribuidos. |
| **RabbitMQ** | `5672` / `15672` | TCP / Dashboard | Broker de mensajería AMQP para orquestación SAGA (Dashboard en `15672`). |
| **Apache Kafka** | `9092` | TCP / Broker | Broker de streaming de datos de alta velocidad para ubicaciones GPS. |

---

## 📋 2. Requisitos Previos

Antes de ejecutar el proyecto, instala las siguientes herramientas en tu entorno de desarrollo:

1.  **Java Development Kit (JDK) 21:** Necesario para compilar y ejecutar los microservicios en Spring Boot 3.x.
2.  **Maven 3.9+:** Gestor de dependencias de Java.
3.  **Docker Desktop & Docker Compose:** Para ejecutar las bases de datos, brokers y servidores de identidad de forma rápida.
4.  **WSL 2 (Windows Subsystem for Linux - Ubuntu):** Muy recomendado para una ejecución fluida de comandos y scripts de red en sistemas Windows.

---

## 🚀 3. Paso a Paso para Levantar el Ecosistema

Sigue esta secuencia lógica para asegurar que todos los servicios arranquen en el orden correcto y se descubran mutuamente:

### Paso 1: Compilar el Backend en WSL / Linux
Abre tu terminal en la raíz del backend (`/backend-delivery/`) y ejecuta el comando de empaquetado de Maven para construir todos los archivos `.jar`:
```bash
cd backend-delivery
mvn clean package -DskipTests
```
*Esto generará los ejecutables compilados dentro de la carpeta `/target/` de cada microservicio.*

### Paso 2: Iniciar la Infraestructura Base (Bases de Datos y Mensajería)
Levanta únicamente los contenedores de soporte (PostgreSQL, MongoDB, Redis, RabbitMQ, Kafka y Keycloak) usando el perfil de docker-compose:
```bash
docker-compose up -d postgres mongodb redis rabbitmq kafka keycloak
```
*Espera aproximadamente **30-45 segundos** a que las bases de datos terminen de inicializarse y Keycloak esté listo para recibir peticiones.*

### Paso 3: Importar y Configurar Keycloak
Cuando Keycloak esté corriendo en el puerto `8080`, debes importar el Realm preconfigurado para evitar tener que configurar los clientes y roles manualmente:

1.  Abre un navegador e ingresa a la consola de administración: **`http://localhost:8080`**.
2.  Inicia sesión con las credenciales de administrador (definidas por defecto en tu archivo `.env` o docker-compose, por ejemplo `admin` / `admin`).
3.  En la esquina superior izquierda, haz clic en el selector de Realms y presiona **"Create Realm"**.
4.  En la opción **"Upload file"**, selecciona el archivo de configuración localizado en tu espacio de trabajo:
    📂 `backend-delivery/keycloak/ceiba-bar-realm.json`
5.  Haz clic en **"Create"**. Esto cargará de manera automática:
    *   El Realm: `ceiba-bar`.
    *   El cliente frontend: `delivery-app` (con flujos OAuth2 de tipo *Proof Key for Code Exchange - PKCE* habilitados).
    *   Los Roles necesarios: `ROLE_ADMIN`, `ROLE_CUSTOMER`, `ROLE_DRIVER`, `ROLE_RESTAURANT`.
    *   Usuarios de prueba iniciales (ej: clientes y repartidores preconfigurados).

### Paso 4: Ejecutar los Microservicios Core
Una vez que Eureka, Keycloak y las bases de datos estén en línea, inicia los microservicios. Puedes levantarlos mediante Docker Compose o de forma individual con Java:

#### Opción A: Levantar todo con Docker Compose (Recomendado)
```bash
docker-compose up -d eureka micro-gateway micro-users micro-customer micro-drivers micro-products micro-payments micro-realtime
```

#### Opción B: Ejecución en modo desarrollo (Individual - para depurar)
Si necesitas depurar el código de algún microservicio, puedes levantarlo de forma independiente usando Maven directamente:
```bash
# Ejemplo: Levantar el Gateway
cd micro-gateway
mvn spring-boot:run

# Ejemplo: Levantar el servicio de pagos
cd micro_payments
mvn spring-boot:run
```

---

## 🔍 4. Verificación de Salud del Ecosistema

Una vez levantado todo, puedes comprobar que el clúster está funcionando de manera óptima visitando los dashboards web locales:

1.  **Eureka Server (`http://localhost:8761`):** Deberías ver listados los **6 microservicios** registrados (`micro_users`, `micro-customer`, `micro-drivers`, `micro_products`, `micro_payments`, `micro-realtime`) en la sección *"Instances currently registered with Eureka"* en estado `UP`. Keycloak no aparece aquí ya que es un servidor IAM externo, no un cliente Spring Cloud.
2.  **RabbitMQ Management (`http://localhost:15672`):** Inicia sesión con las credenciales configuradas en tu archivo `.env` para ver las colas creadas para la orquestación SAGA y verificar que no haya mensajes atascados en cola.
3.  **Keycloak Console (`http://localhost:8080`):** Comprueba que el realm `ceiba-bar` esté activo.
