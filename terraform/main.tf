terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# Configure AWS Provider
provider "aws" {
  region = var.aws_region
}

# VPC and Networking
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "autotest-vpc"
  }
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "autotest-igw"
  }
}

# Public Subnets
resource "aws_subnet" "public" {
  count             = 2
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.${count.index + 1}.0/24"
  availability_zone = data.aws_availability_zones.available.names[count.index]

  map_public_ip_on_launch = true

  tags = {
    Name = "autotest-public-${count.index + 1}"
  }
}

# Route Table
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name = "autotest-public-rt"
  }
}

# Route Table Association
resource "aws_route_table_association" "public" {
  count          = 2
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# Security Groups
resource "aws_security_group" "test" {
  name        = "autotest-test-sg"
  description = "Security group for test environment"
  vpc_id      = aws_vpc.main.id

  # SSH access
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # HTTP access
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # HTTPS access
  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Docker ports
  ingress {
    from_port   = 8081
    to_port     = 8081
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # All outbound traffic
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "autotest-test-sg"
  }
}

resource "aws_security_group" "prod" {
  name        = "autotest-prod-sg"
  description = "Security group for production environment"
  vpc_id      = aws_vpc.main.id

  # SSH access (restricted)
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = var.allowed_ssh_cidr
  }

  # HTTP redirect
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # HTTPS access
  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # All outbound traffic
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "autotest-prod-sg"
  }
}

# Key Pair
resource "aws_key_pair" "main" {
  key_name   = "autotest-key"
  public_key = file(var.ssh_public_key_path)
}

# Test Environment EC2 Instance
resource "aws_instance" "test" {
  ami                    = data.aws_ami.ubuntu.id
  instance_type          = var.test_instance_type
  key_name              = aws_key_pair.main.key_name
  vpc_security_group_ids = [aws_security_group.test.id]
  subnet_id             = aws_subnet.public[0].id

  root_block_device {
    volume_size = 20
    volume_type = "gp3"
  }

  user_data = templatefile("${path.module}/user_data.sh", {
    environment = "test"
    domain_name = var.test_domain_name
  })

  tags = {
    Name = "autotest-test-instance"
  }
}

# Production Environment EC2 Instance
resource "aws_instance" "prod" {
  ami                    = data.aws_ami.ubuntu.id
  instance_type          = var.prod_instance_type
  key_name              = aws_key_pair.main.key_name
  vpc_security_group_ids = [aws_security_group.prod.id]
  subnet_id             = aws_subnet.public[1].id

  root_block_device {
    volume_size = 40
    volume_type = "gp3"
  }

  user_data = templatefile("${path.module}/user_data.sh", {
    environment = "prod"
    domain_name = var.prod_domain_name
  })

  tags = {
    Name = "autotest-prod-instance"
  }
}

# Elastic IPs
resource "aws_eip" "test" {
  instance = aws_instance.test.id
  domain   = "vpc"

  tags = {
    Name = "autotest-test-eip"
  }
}

resource "aws_eip" "prod" {
  instance = aws_instance.prod.id
  domain   = "vpc"

  tags = {
    Name = "autotest-prod-eip"
  }
}

# RDS PostgreSQL for Production
resource "aws_db_instance" "prod" {
  identifier           = "autotest-prod-db"
  engine               = "postgres"
  engine_version       = "15.4"
  instance_class       = var.prod_db_instance_class
  allocated_storage    = 20
  storage_type         = "gp3"
  storage_encrypted    = true

  db_name  = "autotest_prod"
  username = "autotest_user"
  password = var.db_password

  vpc_security_group_ids = [aws_security_group.prod.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name

  backup_retention_period = 7
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"

  skip_final_snapshot = false
  final_snapshot_identifier = "autotest-prod-final-snapshot"

  tags = {
    Name = "autotest-prod-db"
  }
}

# DB Subnet Group
resource "aws_db_subnet_group" "main" {
  name       = "autotest-db-subnet-group"
  subnet_ids = aws_subnet.public[*].id

  tags = {
    Name = "autotest-db-subnet-group"
  }
}

# Data sources
data "aws_availability_zones" "available" {
  state = "available"
}

data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"] # Canonical

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-22.04-amd64-server-*"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}
