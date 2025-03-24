# Thesis Tracker

An application for managing university thesis submissions, reviews, and committee assignments.

## Project Structure

- **Backend**: FastAPI application with PostgreSQL database
- **Frontend**: React application with TypeScript and Tailwind CSS

## Prerequisites

- Docker and Docker Compose
- Node.js 18+ (for local development)
- Python 3.13+ (for local development)
- Poetry (for Python dependency management)

## Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/thesis-tracker.git
   cd thesis-tracker
   ```

2. Create a `.env` file in the root directory with the following variables:
   ```
   POSTGRES_SERVER=postgres
   POSTGRES_USER=postgres
   POSTGRES_PASSWORD=password
   POSTGRES_DB=thesis_tracker
   ```

3. Start the application using Docker Compose:
   ```bash
   docker-compose up -d
   ```

4. Access the application:
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

## Development

### Backend

To run the backend locally:

```bash
cd backend
poetry install
poetry run uvicorn app.main:app --reload
```

### Frontend

To run the frontend locally:

```bash
cd frontend
npm install
npm run dev
```

## Features

- User authentication and role-based access control
- Thesis submission and management
- Review assignment and tracking
- Committee formation and scheduling
- Notifications and status updates
- Analytics and reporting 