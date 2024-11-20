FROM python:3.11

# Set the working directory
WORKDIR /usr/src/app

# Copy requirements file
COPY requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of your application code
COPY . .

RUN chmod 777 entrypoint.sh

# Expose the application port (adjust according to your app's port)
EXPOSE 8100

ENTRYPOINT ["./entrypoint.sh"]

# Start the application
CMD ["python", "manage.py", "runserver_plus", "0.0.0.0:8100"]
