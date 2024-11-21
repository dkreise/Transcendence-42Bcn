# Usa la imagen base oficial de Nginx
FROM nginx:alpine

RUN mkdir -p /var/www 
RUN chmod +x /var/www/

# Copia tu configuración personalizada de Nginx
COPY ./nginx/conf/nginx.conf /etc/nginx/nginx.conf

COPY ./nginx/tools/nginx_start.sh /var/www/

# Copia los archivos del frontend al directorio de Nginx
# COPY ./front/tools/ /usr/share/nginx/html/

# Expone el puerto 8443
EXPOSE 8443

# Mantiene Nginx ejecutándose en primer plano
CMD ["nginx", "-g", "daemon off;"]
