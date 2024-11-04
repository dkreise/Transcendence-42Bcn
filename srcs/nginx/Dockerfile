# Use Nginx to serve static files
FROM nginx:alpine

RUN mkdir -p /var/www 
RUN chmod +x /var/www/

COPY ./tools/nginx_start.sh /var/www/
# Copy custom Nginx config
COPY ./conf/nginx.conf /etc/nginx/nginx.conf

# Expose port 80 for Nginx (default for Nginx)
EXPOSE 8443

# Set entrypoint to start the services
CMD ["nginx", "-g", "daemon off;"]