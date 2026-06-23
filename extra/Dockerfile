FROM postgres:16-alpine

COPY ./start-scripts/db_schema.sql /docker-entrypoint-initdb.d/

EXPOSE 5432
