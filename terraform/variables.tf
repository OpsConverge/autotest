variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "ssh_public_key_path" {
  description = "Path to SSH public key file"
  type        = string
  default     = "~/.ssh/id_rsa.pub"
}

variable "allowed_ssh_cidr" {
  description = "CIDR blocks allowed for SSH access to production"
  type        = list(string)
  default     = ["0.0.0.0/0"]  # Change this to your IP for production
}

variable "test_instance_type" {
  description = "EC2 instance type for test environment"
  type        = string
  default     = "t3.medium"
}

variable "prod_instance_type" {
  description = "EC2 instance type for production environment"
  type        = string
  default     = "t3.large"
}

variable "test_domain_name" {
  description = "Domain name for test environment"
  type        = string
  default     = "test.yourdomain.com"
}

variable "prod_domain_name" {
  description = "Domain name for production environment"
  type        = string
  default     = "yourdomain.com"
}

variable "prod_db_instance_class" {
  description = "RDS instance class for production database"
  type        = string
  default     = "db.t3.micro"
}

variable "db_password" {
  description = "Database password"
  type        = string
  sensitive   = true
}

variable "jwt_secret" {
  description = "JWT secret for authentication"
  type        = string
  sensitive   = true
}

variable "github_client_id" {
  description = "GitHub OAuth client ID"
  type        = string
  default     = ""
}

variable "github_client_secret" {
  description = "GitHub OAuth client secret"
  type        = string
  sensitive   = true
  default     = ""
}
