#!/bin/bash

echo "🚀 Starting Both Production and Test Environments..."
echo ""
echo "📊 Production Environment:"
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:4000"
echo "   Database: localhost:5432"
echo ""
echo "🧪 Test Environment:"
echo "   Frontend: http://localhost:3001"
echo "   Backend:  http://localhost:4001"
echo "   Database: localhost:5433"
echo ""

# Start both environments
docker-compose --profile prod --profile test up -d

echo ""
echo "✅ Both environments started!"
echo "📝 To view production logs: docker-compose --profile prod logs -f"
echo "📝 To view test logs: docker-compose --profile test logs -f"
echo "🛑 To stop both: docker-compose --profile prod --profile test down"
