# 🔌 Especificación de APIs y Contratos de Integración — Ceiba-Bar Delivery v2

Esta documentación define la firma de los endpoints de la API expuestos por los microservicios a través del **API Gateway (`micro-gateway`)**, incluyendo estructuras de datos JSON, cabeceras de autorización y el formato global de gestión de excepciones.

---

## 🔑 1. Flujo de Autenticación (OIDC / Keycloak)

El sistema utiliza **Keycloak** para la autenticación y autorización mediante tokens **JWT**. Todos los endpoints seguros (excepto registro de usuarios y catálogo público) requieren el encabezado:
`Authorization: Bearer <JWT_TOKEN>`

### Obtener Token de Acceso (Login)
*   **Método:** `POST`
*   **URL:** `http://localhost:8080/realms/ceiba-bar/protocol/openid-connect/token`
*   **Content-Type:** `application/x-www-form-urlencoded`
*   **Request Body (FormData):**
    ```ini
    client_id=delivery-app
    grant_type=password
    username=cliente@ceiba.com
    password=password123
    ```
*   **Response (200 OK):**
    ```json
    {
      "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expires_in": 300,
      "refresh_token": "eyJhbGciOiJSUzI1...",
      "token_type": "Bearer",
      "scope": "email profile"
    }
    ```

---

## 🌐 2. Catálogo de Endpoints de Producción (REST)

El API Gateway escucha en el puerto **`8090`** y enruta las peticiones de acuerdo con las siguientes reglas de enrutamiento:

### A. Gestión de Usuarios (`micro_users` ➔ `/api/users/**`)

#### Registrar Nuevo Cliente (Público)
*   **Método:** `POST`
*   **URL:** `/api/users/register`
*   **Payload (JSON):**
    ```json
    {
      "name": "Juan",
      "lastname": "Pérez",
      "email": "juan.perez@ceiba.com",
      "password": "seguraPassword123",
      "phone": 5512345678,
      "image": ""
    }
    ```
*   **Response (201 Created):**
    ```json
    {
      "success": true,
      "message": "Usuario creado exitosamente",
      "data": {
        "id": "87564d-7a65-473e-b25c-dd19d6",
        "email": "juan.perez@ceiba.com",
        "role": "CUSTOMER"
      }
    }
    ```

---

### B. Catálogo de Menús y Productos (`micro_products` ➔ `/api/products/**`)

#### Obtener Productos Disponibles (Público)
*   **Método:** `GET`
*   **URL:** `/api/products`
*   **Response (200 OK):**
    ```json
    {
      "success": true,
      "message": "Productos obtenidos exitosamente",
      "count": 2,
      "data": [
        {
          "id": 1,
          "name": "Cerveza Ceiba Clara",
          "description": "Cerveza artesanal de la casa 355ml",
          "price": 45.0,
          "image": "/api/products/images/ceiba-clara.png",
          "available": true,
          "type": "ALCOHOLIC"
        },
        {
          "id": 2,
          "name": "Nachos con Queso",
          "description": "Nachos crujientes con queso cheddar derretido",
          "price": 75.0,
          "image": "/api/products/images/nachos.png",
          "available": true
        }
      ]
    }
    ```

---

### C. Pasarela de Pagos (`micro_payments` ➔ `/api/payments/**`)

#### Crear Sesión de Pago (Stripe / PayPal)
*   **Método:** `POST`
*   **URL:** `/api/payments/checkout`
*   **Headers:** `Authorization: Bearer <JWT>`
*   **Payload (JSON):**
    ```json
    {
      "customerId": 1,
      "amount": 120.0,
      "method": "stripe",
      "tempOrderData": "{\"customerName\":\"Juan Pérez\",\"customerEmail\":\"juan.perez@ceiba.com\",\"products\":[{\"id\":1,\"quantity\":1},{\"id\":2,\"quantity\":1}]}"
    }
    ```
*   **Response (200 OK):**
    ```json
    {
      "success": true,
      "message": "Sesión de checkout creada exitosamente",
      "data": "https://checkout.stripe.com/c/pay/cs_test_a1b2c3d4..."
    }
    ```

#### Validar Estado de Pago (Sondeo del Frontend)
*   **Método:** `GET`
*   **URL:** `/api/payments/validate/{method}/{sessionId}`
*   *Parámetros:* `method` (`stripe` o `paypal`), `sessionId` (ID de sesión o de orden).
*   **Response (200 OK - Pago Exitoso):**
    ```json
    {
      "success": true,
      "message": "Pago validado exitosamente",
      "data": "142" 
    }
    ```
    *Nota: `data` contiene el `orderId` generado automáticamente por la saga del backend tras el pago.*

---

### D. Gestión de Órdenes y Entregas (`micro-realtime` ➔ `/api/orders/**`)

#### Crear Orden Directa (Interno / Admin)
*   **Método:** `POST`
*   **URL:** `/api/orders`
*   **Payload (JSON):**
    ```json
    {
      "customerName": "Juan Pérez",
      "customerEmail": "juan.perez@ceiba.com",
      "street": "Av. Reforma 123",
      "colonia": "Juárez",
      "city": "CDMX",
      "postalCode": "06600",
      "deliveryLatitude": 19.432607,
      "deliveryLongitude": -99.133209,
      "products": [
        {
          "productId": 1,
          "productName": "Cerveza Ceiba Clara",
          "quantity": 2,
          "unitPrice": 45.0
        }
      ],
      "total": 90.0
    }
    ```
*   **Response (201 Created):**
    ```json
    {
      "success": true,
      "message": "Orden creada",
      "data": {
        "id": 142,
        "status": "CREATED",
        "total": 90.0,
        "createdAt": "2026-07-01T16:42:00"
      }
    }
    ```

---

## 🚫 3. Formato Estándar de Excepciones (API Errors)

Todos los microservicios implementan el **Global Exception Handler** para capturar errores y formatearlos antes de enviarlos al frontend, evitando fugas de excepciones internas o stack traces de base de datos.

### Error de Validación de Datos de Entrada (400 Bad Request)
*   **Causa:** Se envía un JSON al cual le faltan campos obligatorios marcados con `@NotNull` o `@NotBlank`.
*   **Formato de Respuesta (400):**
    ```json
    {
      "success": false,
      "message": "Error de validación en los datos de entrada",
      "timestamp": "2026-07-01T16:43:05",
      "errors": {
        "customerEmail": "El email del cliente es requerido",
        "products": "Debe seleccionar al menos un producto"
      }
    }
    ```

### Error de Negocio o Conflicto (409 Conflict)
*   **Causa:** Conflicto transaccional (ej: intentar reservar stock de un producto agotado o asignar un conductor no disponible).
*   **Formato de Respuesta (409):**
    ```json
    {
      "success": false,
      "message": "Stock insuficiente para el producto: Cerveza Ceiba Clara (ID: 1)",
      "timestamp": "2026-07-01T16:43:10"
    }
    ```
