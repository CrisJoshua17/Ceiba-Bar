# ========== STAGE 1: Build ==========
FROM maven:3.9-eclipse-temurin-21 AS builder
WORKDIR /app

# Copiar pom.xml y descargar dependencias (se cachea si no cambia)
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copiar código fuente y compilar
COPY src ./src
RUN mvn clean package -DskipTests

# ========== STAGE 2: Runtime ==========
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Copiar JAR desde stage anterior
COPY --from=builder /app/target/*.jar app.jar

# Exponer puerto del servicio
EXPOSE 8762

# Activar perfil dev por defecto
ENV SPRING_PROFILES_ACTIVE=dev

# Ejecutar aplicación
ENTRYPOINT ["java", "-jar", "app.jar"]
