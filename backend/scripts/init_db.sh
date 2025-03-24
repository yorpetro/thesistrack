#!/bin/bash

# Exit on error
set -e

# Create initial database migration
echo "Creating initial migration..."
alembic revision --autogenerate -m "initial"

# Apply migrations
echo "Applying migrations..."
alembic upgrade head

echo "Database initialization complete." 