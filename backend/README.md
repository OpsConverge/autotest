# Autotest Local Backend

This is a minimal Node/Express backend for local development.

## Setup

1. Open a terminal in the `backend/` directory.
2. Run `npm install` to install dependencies.
3. Run `npm start` to start the backend server.

The backend will run on http://localhost:4000 and expose API endpoints at /api/.

## Endpoints

- `POST /api/auth/register` — Register a new user (email, password)
- `POST /api/auth/login` — Login with email and password (returns JWT)

**Note:** This backend uses an in-memory user store and is for development only. 