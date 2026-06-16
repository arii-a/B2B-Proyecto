FROM postgres:18-alpine

COPY ./start-scripts/db_schema.sql /docker-entrypoint-initdb.d/

EXPOSE 5432

FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

COPY B2B-api-0.0.1-SNAPSHOT.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
