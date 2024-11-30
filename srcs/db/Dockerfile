FROM postgres:latest

# Temporarily switch to root to change permissions
USER root

ENV POSTGRES_USER=admin
ENV POSTGRES_PASSWORD=12345
ENV POSTGRES_DB=transcendence

# Ensure the PostgreSQL data directory is owned by the `postgres` user
# RUN chown -R postgres:postgres /var/lib/postgresql/data

EXPOSE 5432
