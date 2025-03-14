FROM python:3.11

# Set the working directory
WORKDIR /usr/src/app

# Copy requirements file
COPY requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of your application code
COPY . .

# Expose ports and Run Daphne 
EXPOSE 8000
CMD ["daphne", "-b", "0.0.0.0", "-p", "8000", "user_mgmt.asgi:application"]
