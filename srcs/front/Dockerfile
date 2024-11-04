# Base image with Node and Nginx for serving static files
FROM node:18 

# Set the working directory
WORKDIR /app

# Copy package.json and install dependencies
COPY ./conf/package.json ./
RUN npm install && npm install -g nodemon && npm install express

# Copy frontend source files to Nginx's default directory
#COPY --from=build /app/src /usr/share/nginx/html


# Expose port 80 for Nginx (default for Nginx)
EXPOSE 2424

# Start the app with nodemon to watch for file changes
CMD ["nodemon", "--watch", ".", "--ext", "js,html,css", "server.js"]