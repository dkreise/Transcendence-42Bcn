#!/bin/bash
# Remove any existing data from the directory
rm -rf /var/lib/postgresql/data/*

# Run the original entrypoint to start PostgreSQL
exec docker-entrypoint.sh "$@"
