import pytest
import requests
import json
from typing import Dict, Any

class TestExpressBackendIntegration:
    """Integration tests for Express Backend using pytest and requests."""
    
    @pytest.fixture
    def base_url(self):
        """Base URL for the API."""
        return "http://localhost:4000"
    
    @pytest.fixture
    def headers(self):
        """Default headers for API requests."""
        return {
            "Content-Type": "application/json",
            "Accept": "application/json"
        }
    
    @pytest.fixture
    def auth_headers(self, headers):
        """Headers with authentication token."""
        return headers.copy()
    
    @pytest.fixture
    def test_user(self):
        """Test user data."""
        return {
            "email": "test@example.com",
            "password": "password123"
        }
    
    def test_health_check(self, base_url):
        """Test health check endpoint."""
        response = requests.get(f"{base_url}/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert "timestamp" in data
    
    def test_register_user(self, base_url, headers, test_user):
        """Test user registration."""
        response = requests.post(
            f"{base_url}/api/auth/register",
            headers=headers,
            data=json.dumps(test_user)
        )
        assert response.status_code == 201
        data = response.json()
        assert "message" in data
        assert "successfully" in data["message"].lower()
    
    def test_login_user(self, base_url, headers, test_user):
        """Test user login."""
        response = requests.post(
            f"{base_url}/api/auth/login",
            headers=headers,
            data=json.dumps(test_user)
        )
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert "user" in data
        assert data["user"]["email"] == test_user["email"]
        return data["token"]
    
    def test_get_user_profile(self, base_url, headers, test_user):
        """Test getting user profile with authentication."""
        # First login to get token
        login_response = requests.post(
            f"{base_url}/api/auth/login",
            headers=headers,
            data=json.dumps(test_user)
        )
        assert login_response.status_code == 200
        token = login_response.json()["token"]
        
        # Get user profile
        auth_headers = headers.copy()
        auth_headers["Authorization"] = f"Bearer {token}"
        
        response = requests.get(
            f"{base_url}/api/auth/me",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "email" in data
        assert data["email"] == test_user["email"]
    
    def test_get_teams(self, base_url, headers, test_user):
        """Test getting teams with authentication."""
        # First login to get token
        login_response = requests.post(
            f"{base_url}/api/auth/login",
            headers=headers,
            data=json.dumps(test_user)
        )
        assert login_response.status_code == 200
        token = login_response.json()["token"]
        
        # Get teams
        auth_headers = headers.copy()
        auth_headers["Authorization"] = f"Bearer {token}"
        
        response = requests.get(
            f"{base_url}/api/teams",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    def test_create_team(self, base_url, headers, test_user):
        """Test creating a team."""
        # First login to get token
        login_response = requests.post(
            f"{base_url}/api/auth/login",
            headers=headers,
            data=json.dumps(test_user)
        )
        assert login_response.status_code == 200
        token = login_response.json()["token"]
        
        # Create team
        auth_headers = headers.copy()
        auth_headers["Authorization"] = f"Bearer {token}"
        
        team_data = {
            "name": "Test Team",
            "description": "A test team for API testing"
        }
        
        response = requests.post(
            f"{base_url}/api/teams",
            headers=auth_headers,
            data=json.dumps(team_data)
        )
        assert response.status_code == 201
        data = response.json()
        assert "id" in data
        assert data["name"] == team_data["name"]
        return data["id"]
    
    def test_get_tests(self, base_url, headers, test_user):
        """Test getting tests with authentication."""
        # First login to get token
        login_response = requests.post(
            f"{base_url}/api/auth/login",
            headers=headers,
            data=json.dumps(test_user)
        )
        assert login_response.status_code == 200
        token = login_response.json()["token"]
        
        # Get tests
        auth_headers = headers.copy()
        auth_headers["Authorization"] = f"Bearer {token}"
        
        response = requests.get(
            f"{base_url}/api/tests",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    def test_create_test(self, base_url, headers, test_user):
        """Test creating a test."""
        # First login to get token
        login_response = requests.post(
            f"{base_url}/api/auth/login",
            headers=headers,
            data=json.dumps(test_user)
        )
        assert login_response.status_code == 200
        token = login_response.json()["token"]
        
        # Create team first
        auth_headers = headers.copy()
        auth_headers["Authorization"] = f"Bearer {token}"
        
        team_data = {
            "name": "Test Team",
            "description": "A test team for API testing"
        }
        
        team_response = requests.post(
            f"{base_url}/api/teams",
            headers=auth_headers,
            data=json.dumps(team_data)
        )
        assert team_response.status_code == 201
        team_id = team_response.json()["id"]
        
        # Create test
        test_data = {
            "name": "API Test",
            "description": "Test created via API",
            "type": "api",
            "teamId": team_id
        }
        
        response = requests.post(
            f"{base_url}/api/tests",
            headers=auth_headers,
            data=json.dumps(test_data)
        )
        assert response.status_code == 201
        data = response.json()
        assert "id" in data
        assert data["name"] == test_data["name"]
    
    def test_unauthorized_access(self, base_url, headers):
        """Test unauthorized access to protected endpoints."""
        response = requests.get(
            f"{base_url}/api/teams",
            headers=headers
        )
        assert response.status_code == 401
    
    def test_invalid_login(self, base_url, headers):
        """Test login with invalid credentials."""
        invalid_user = {
            "email": "wrong@example.com",
            "password": "wrongpassword"
        }
        
        response = requests.post(
            f"{base_url}/api/auth/login",
            headers=headers,
            data=json.dumps(invalid_user)
        )
        assert response.status_code == 401
    
    def test_invalid_registration(self, base_url, headers):
        """Test registration with invalid data."""
        invalid_user = {
            "email": "invalid-email",
            "password": "password123"
        }
        
        response = requests.post(
            f"{base_url}/api/auth/register",
            headers=headers,
            data=json.dumps(invalid_user)
        )
        assert response.status_code == 400
    
    @pytest.mark.parametrize("invalid_user", [
        {"email": "test@example.com"},  # Missing password
        {"password": "password123"},    # Missing email
        {"email": "", "password": "password123"},  # Empty email
        {"email": "test@example.com", "password": ""}  # Empty password
    ])
    def test_registration_validation(self, base_url, headers, invalid_user):
        """Test user registration validation."""
        response = requests.post(
            f"{base_url}/api/auth/register",
            headers=headers,
            data=json.dumps(invalid_user)
        )
        assert response.status_code == 400
