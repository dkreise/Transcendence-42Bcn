FROM nginx:alpine

# Create the directory where static files will be stored
RUN mkdir -p /usr/share/nginx/html/static

# Install wget to download Bootstrap
RUN apk add --no-cache wget

# Download Bootstrap CSS and JS and place them in the static directory
RUN wget https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css -O /usr/share/nginx/html/static/bootstrap.min.css && \
    wget https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js -O /usr/share/nginx/html/static/bootstrap.bundle.min.js

# Copy the static files to the correct directory
COPY ./static /usr/share/nginx/html/static

# Copy the custom Nginx configuration
COPY ./conf/nginx.conf /etc/nginx/nginx.conf

# Expose port 8443 for HTTPS traffic
EXPOSE 8443

# Copy env-config.js template
COPY ./env-config.template.js /usr/share/nginx/html/env-config.template.js

# Install gettext for envsubst (minimal change)
RUN apk add --no-cache gettext

# Create an entrypoint script that replaces the environment variables at runtime
RUN echo '#!/bin/sh' > /docker-entrypoint.sh && \
    echo 'envsubst < /usr/share/nginx/html/env-config.template.js > /usr/share/nginx/html/static/js/env-config.js' >> /docker-entrypoint.sh && \
    echo 'exec "$@"' >> /docker-entrypoint.sh && \
    chmod +x /docker-entrypoint.sh

# Set entrypoint script
ENTRYPOINT ["/docker-entrypoint.sh"]

# Use the default Nginx command to keep it running
CMD ["nginx", "-g", "daemon off;"]

