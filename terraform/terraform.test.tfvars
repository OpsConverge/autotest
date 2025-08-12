# Test Environment Configuration
aws_region = "us-east-1"

# Instance Configuration
test_instance_type = "t3.medium"
prod_instance_type = "t3.large"

# Domain Configuration
test_domain_name = "test.yourdomain.com"
prod_domain_name = "yourdomain.com"

# Database Configuration
prod_db_instance_class = "db.t3.micro"
db_password = "your-secure-db-password-here"

# Security Configuration
allowed_ssh_cidr = ["0.0.0.0/0"]  # Change this to your IP for production

# SSH Key Configuration
ssh_public_key_path = "~/.ssh/id_rsa.pub"

# JWT Secret
jwt_secret = "your-super-secret-jwt-key-for-testing"

# GitHub OAuth (optional)
github_client_id = ""
github_client_secret = ""
