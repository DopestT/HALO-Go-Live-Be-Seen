# Use official Python runtime as base image
FROM python:3.11-slim

# Set working directory in container
WORKDIR /app

# Copy requirements file
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the dashboard script
COPY dashboard_terminal.py .

# Set environment to force colors in terminal output
ENV TERM=xterm-256color
ENV PYTHONUNBUFFERED=1

# Run the dashboard when container starts
CMD ["python", "dashboard_terminal.py"]
