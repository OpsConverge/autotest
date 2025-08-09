#!/bin/bash

echo "🧪 Starting Test Environment..."
echo "📊 Test environment will be available at:"
echo "   Frontend: http://localhost:3001"
echo "   Backend:  http://localhost:4001"
echo "   Database: localhost:5433"
echo ""

# Start test environment
docker-compose --profile test up -d

echo ""
echo "✅ Test environment started!"
echo "📝 To view logs: docker-compose --profile test logs -f"
echo "🛑 To stop: docker-compose --profile test down"
