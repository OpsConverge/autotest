#!/bin/bash

echo "🚀 Starting Production Environment..."
echo "📊 Production will be available at:"
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:4000"
echo "   Database: localhost:5432"
echo ""

# Start production environment
docker-compose --profile prod up -d

echo ""
echo "✅ Production environment started!"
echo "📝 To view logs: docker-compose --profile prod logs -f"
echo "🛑 To stop: docker-compose --profile prod down"
