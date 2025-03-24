FROM python:3.13-slim

WORKDIR /app

# Install Poetry
RUN pip install poetry==1.7.1

# Copy only requirements to cache them in docker layer
COPY pyproject.toml poetry.lock* /app/

# Configure poetry
RUN poetry config virtualenvs.create false \
    && poetry install --no-interaction --no-ansi --no-root

# Copy project
COPY . /app/

# Make scripts executable and create uploads directory
RUN chmod +x /app/scripts/start.sh /app/scripts/init_db.sh \
    && mkdir -p /app/uploads \
    && chmod 777 /app/uploads

# Run the application
CMD ["/app/scripts/start.sh"] 