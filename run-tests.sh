#!/bin/bash

echo "🧪 Running Tests Against Test Environment..."
echo "📍 Test Environment: http://localhost:3001"
echo "🔗 API Endpoint: http://localhost:4001"
echo ""

# Check if test environment is running
if ! docker ps | grep -q "autotest-frontend-test"; then
    echo "❌ Test environment is not running!"
    echo "🚀 Start it first with: ./start-test.sh"
    exit 1
fi

echo "✅ Test environment is running"
echo ""

# Function to run API tests
run_api_tests() {
    echo "🔌 Testing API Endpoints..."
    
    # Test health endpoint
    echo "  📊 Testing health endpoint..."
    curl -s http://localhost:4001/health | jq . || echo "    ❌ Health check failed"
    
    # Test database connection
    echo "  🗄️  Testing database connection..."
    curl -s http://localhost:4001/api/health | jq . || echo "    ❌ Database check failed"
    
    echo ""
}

# Function to run frontend tests
run_frontend_tests() {
    echo "🌐 Testing Frontend..."
    
    # Test if frontend is accessible
    echo "  📱 Testing frontend accessibility..."
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:3001 | grep -q "200\|304"; then
        echo "    ✅ Frontend is accessible"
    else
        echo "    ❌ Frontend is not accessible"
    fi
    
    echo ""
}

# Function to run integration tests
run_integration_tests() {
    echo "🔗 Testing Integration Flows..."
    
    echo "  🔐 Testing registration flow..."
    # Create a test user
    TEST_EMAIL="test-$(date +%s)@example.com"
    TEST_PASSWORD="testpass123"
    
    REGISTER_RESPONSE=$(curl -s -X POST http://localhost:4001/api/auth/register \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}")
    
    if echo "$REGISTER_RESPONSE" | grep -q "success"; then
        echo "    ✅ Registration successful for $TEST_EMAIL"
        
        # Test login
        LOGIN_RESPONSE=$(curl -s -X POST http://localhost:4001/api/auth/login \
            -H "Content-Type: application/json" \
            -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}")
        
        if echo "$LOGIN_RESPONSE" | grep -q "token"; then
            echo "    ✅ Login successful"
            
            # Extract token for further tests
            TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.token')
            
            # Test teams endpoint
            TEAMS_RESPONSE=$(curl -s http://localhost:4001/api/teams \
                -H "Authorization: Bearer $TOKEN")
            
            if echo "$TEAMS_RESPONSE" | grep -q "teams"; then
                echo "    ✅ Teams endpoint accessible"
            else
                echo "    ❌ Teams endpoint failed"
            fi
        else
            echo "    ❌ Login failed"
        fi
    else
        echo "    ❌ Registration failed"
    fi
    
    echo ""
}

# Function to run performance tests
run_performance_tests() {
    echo "⚡ Testing Performance..."
    
    echo "  🚀 Testing API response time..."
    START_TIME=$(date +%s%N)
    curl -s http://localhost:4001/health > /dev/null
    END_TIME=$(date +%s%N)
    
    RESPONSE_TIME=$(( (END_TIME - START_TIME) / 1000000 ))
    echo "    📊 Health endpoint response time: ${RESPONSE_TIME}ms"
    
    if [ $RESPONSE_TIME -lt 100 ]; then
        echo "    ✅ Response time is good (< 100ms)"
    elif [ $RESPONSE_TIME -lt 500 ]; then
        echo "    ⚠️  Response time is acceptable (< 500ms)"
    else
        echo "    ❌ Response time is slow (> 500ms)"
    fi
    
    echo ""
}

# Function to run load tests
run_load_tests() {
    echo "📈 Running Load Tests..."
    
    echo "  🔄 Testing concurrent requests..."
    for i in {1..10}; do
        curl -s http://localhost:4001/health > /dev/null &
    done
    wait
    
    echo "    ✅ 10 concurrent requests completed"
    echo ""
}

# Main test execution
echo "🚀 Starting comprehensive test suite..."
echo ""

run_api_tests
run_frontend_tests
run_integration_tests
run_performance_tests
run_load_tests

echo "🎉 Test suite completed!"
echo ""
echo "📊 Summary:"
echo "   🌐 Frontend: http://localhost:3001"
echo "   🔌 Backend: http://localhost:4001"
echo "   🗄️  Database: localhost:5433"
echo ""
echo "📝 View logs: docker-compose --profile test logs -f"
echo "🛑 Stop test environment: docker-compose --profile test down"
