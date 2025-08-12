# Production Environment Configuration
aws_region = "us-east-1"

# Instance Configuration
test_instance_type = "t3.medium"
prod_instance_type = "t3.large"

# Domain Configuration
test_domain_name = "test.yourdomain.com"
prod_domain_name = "yourdomain.com"

# Database Configuration
prod_db_instance_class = "db.t3.small"  # Larger instance for production
db_password = "your-super-secure-production-db-password"

# Security Configuration
allowed_ssh_cidr = ["YOUR_IP_ADDRESS/32"]  # Replace with your actual IP

# SSH Key Configuration
ssh_public_key_path = "~/.ssh/id_rsa.pub"

# JWT Secret
jwt_secret = "your-super-secret-jwt-key-for-production"

# GitHub OAuth (if using)
github_client_id = "your-github-client-id"
github_client_secret = "your-github-client-secret"
