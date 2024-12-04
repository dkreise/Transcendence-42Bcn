# Usa una imagen ligera de Nginx como base
FROM nginx:alpine

# Crea el directorio donde se almacenarán los archivos estáticos
RUN mkdir -p /usr/share/nginx/html/static

# Copia los archivos estáticos al directorio correcto
COPY ./static /usr/share/nginx/html/static

# Copia la configuración personalizada de Nginx
COPY ./conf/nginx.conf /etc/nginx/nginx.conf

# Expone el puerto 8443 para tráfico HTTPS
EXPOSE 8443

# Usa el comando por defecto de Nginx para mantenerlo en ejecución
CMD ["nginx", "-g", "daemon off;"]
