FROM python:3.11

# Set the working directory
WORKDIR /usr/src/app

# Copy requirements file
COPY requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of your application code
COPY . .

# Expose the necessary ports
EXPOSE 8001

# Run Daphne 
CMD ["daphne", "-b", "0.0.0.0", "-p", "8001", "game.asgi:application"]

#*SECURE_MODE*-># comment 2 both lines above and uncomment the lines below.
# EXPOSE 8445
# CMD ["daphne", "-e", "ssl:8445:privateKey=/usr/src/app/certs/key.pem:certKey=/usr/src/app/certs/crt.pem", "game.asgi:application", "-b", "0.0.0.0", "-p", "81"]
