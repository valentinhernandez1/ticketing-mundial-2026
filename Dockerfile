# Stage 1 — Build React
FROM node:20-alpine AS frontend
WORKDIR /frontend
COPY frontend/package.json ./
RUN npm install
COPY frontend/ .
RUN npm run build

# Stage 2 — Build Spring Boot
FROM maven:3.9-eclipse-temurin-21 AS backend
WORKDIR /build
COPY springboot/pom.xml .
RUN mvn dependency:go-offline -q
COPY springboot/src ./src
COPY --from=frontend /frontend/dist ./src/main/resources/static/
RUN mvn package -DskipTests -q

# Stage 3 — Runtime
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=backend /build/target/ticketing-mundial2026-1.0.0.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
