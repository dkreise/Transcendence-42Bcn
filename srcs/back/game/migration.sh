#!/bin/bash

# Apply migrations automatically
python3 manage.py makemigrations
python3 manage.py migrate

# Start the servers
# python3 manage.py runserver_plus 8100
