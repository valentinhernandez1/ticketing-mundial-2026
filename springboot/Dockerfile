# Stage 1: compilar el JAR con Maven
FROM maven:3.9-eclipse-temurin-21 AS builder
WORKDIR /build
COPY pom.xml .
# Descarga dependencias primero (cache de Docker)
RUN mvn dependency:go-offline -q
COPY src ./src
RUN mvn package -DskipTests -q

# Stage 2: imagen mínima para ejecutar
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=builder /build/target/ticketing-mundial2026-1.0.0.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
