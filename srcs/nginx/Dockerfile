# Use Nginx to serve static files
FROM nginx:alpine

RUN mkdir -p /var/www/html/assets
RUN chmod +x /var/www/html/assets

COPY ./tools/nginx_start.sh /var/www/
# Copy custom Nginx config
COPY ./conf/nginx.conf /etc/nginx/nginx.conf
COPY ./tools/nginx_start.sh /var/www/
COPY ./assets/favicon.png /var/www/html/assets
# Expose port 80 for Nginx (default for Nginx)
EXPOSE 8443

# Set entrypoint to start the services
CMD ["nginx", "-g", "daemon off;"]