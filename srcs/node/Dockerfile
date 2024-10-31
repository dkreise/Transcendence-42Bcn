# Base image with Node and Nginx for serving static files
FROM node:16 AS build

# Set the working directory
WORKDIR /app

# Copy package.json and install dependencies
COPY package.json ./
RUN npm install

# Copy all frontend source code
COPY . .

# Use Nginx to serve static files
FROM nginx:alpine

# Copy custom Nginx config
COPY nginx.conf /etc/nginx/nginx.conf

# Copy frontend source files to Nginx's default directory
COPY --from=build /app /app


# Copy frontend source files to Nginx's default directory
#COPY --from=build /app/src /usr/share/nginx/html

# Copy entrypoint script to root directory
# COPY entrypoint.sh /entrypoint.sh
# RUN chmod +x /entrypoint.sh

# Expose port 80 for Nginx (default for Nginx)
EXPOSE 8080

# Set entrypoint to start the services
CMD ["nginx", "-g", "daemon off;"]