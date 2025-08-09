# FROM node:18-alpine

# # Install curl (needed for health checks and wait-for-it)
# RUN apk add --no-cache curl bash

# WORKDIR /app

# COPY package*.json ./
# RUN npm ci

# COPY . .

# # Add wait-for-it script (to wait for Postgres)
# COPY wait-for-it.sh /app/wait-for-it.sh
# RUN chmod +x /app/wait-for-it.sh

# EXPOSE 4000

# CMD ["./wait-for-it.sh", "postgres:5432", "--", "npm", "start"]



# Backend Dockerfile
FROM node:18-alpine

# Install necessary packages for Prisma and health checks
RUN apk add --no-cache openssl curl

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies for Prisma)
RUN npm ci

# Copy source code
COPY . .

# Make startup script executable
RUN chmod +x start.sh

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Change ownership of the app directory
RUN chown -R nodejs:nodejs /app
USER nodejs

# Expose port
EXPOSE 4000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:4000/health || exit 1

# Start the application
CMD ["./start.sh"]
