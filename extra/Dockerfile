FROM postgres:18-alpine

COPY ./resources/db_schema.sql /docker-entrypoint-initdb.d/

EXPOSE 5432

FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

COPY ./resources/B2B-spring-v1.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
