#!/bin/sh

# Set Prisma environment variables for Alpine compatibility
export PRISMA_QUERY_ENGINE_TYPE=binary
export PRISMA_QUERY_ENGINE_BINARY=linux-musl-openssl-3.0.x

echo "Starting backend service..."

# Generate Prisma client
echo "Generating Prisma client..."
npx prisma generate

# Try to run migrations, but don't fail if they're already applied
echo "Checking if migrations are needed..."
npx prisma migrate deploy --skip-seed || echo "Database schema is already up to date, skipping migrations"

echo "Starting the application..."
npm start
