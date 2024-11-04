#!/bin/bash
#sleep 10

# if [ ! -f ${SS_CERT} ]; then
# 	openssl req -newkey rsa:4096 -x509 -days 365 -nodes -out ${SS_CERT} -keyout ${SS_KEY} -subj "/C=ES/ST=Barcelona/L=Barcelona/O=42 Barcelona/CN=${DOMAIN_NAME}";
# fi
exec "$@"