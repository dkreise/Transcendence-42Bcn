# Usa una imagen de Nginx ligera como base
FROM nginx:alpine

# Crea el directorio donde se almacenarán los archivos estáticos
RUN mkdir -p /usr/share/nginx/html

# Copia tus archivos estáticos al directorio de Nginx
COPY ./tools /usr/share/nginx/html

COPY ./conf/nginx.conf /etc/nginx/nginx.conf

# Expone el puerto en el que Nginx está configurado (8443 en este caso)
EXPOSE 8443

# Usa el comando por defecto de Nginx para mantenerlo en ejecución
CMD ["nginx", "-g", "daemon off;"]
