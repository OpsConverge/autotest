# Multi-stage build for React frontend
FROM node:18 AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies with legacy peer deps
RUN npm ci --legacy-peer-deps

# Copy source code
COPY . .

# Set environment variables to handle rollup issues
ENV ROLLUP_SKIP_NATIVE=true
ENV NODE_ENV=production

# Build the application
RUN npm run build

# Production stage - use a simple HTTP server
FROM node:18-alpine

# Install a simple HTTP server
RUN npm install -g serve

# Copy built application from builder stage
COPY --from=builder /app/dist /app

# Set working directory
WORKDIR /app

# Expose port 3000
EXPOSE 3000

# Start the HTTP server
CMD ["serve", "-s", ".", "-l", "3000"]
#CMD ["serve", "-s", ".", "-l", "0.0.0.0 3000"]
#CMD ["serve", "-s", ".", "-l", "3000", "--listen", "0.0.0.0"]

