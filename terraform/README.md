# EC2 Deployment with Terraform

This directory contains Terraform configurations for deploying the Base44 Test Management App on AWS EC2 with local PostgreSQL.

## 🏗️ Architecture

- **EC2 Instance**: t3.medium running Ubuntu 22.04
- **PostgreSQL**: Local installation on EC2 (cost-effective for MVP)
- **VPC**: Custom VPC with public and private subnets
- **Security Groups**: Restricted access for security
- **Docker**: Containerized application deployment

## 🚀 Quick Start

### Prerequisites

1. **Terraform** (>= 1.0)
2. **AWS CLI** configured
3. **SSH key pair** for EC2 access

### Setup Steps

1. **Clone and navigate:**
   ```bash
   cd terraform
   ```

2. **Generate SSH key pair:**
   ```bash
   ssh-keygen -t rsa -b 4096 -f ~/.ssh/base44-deployer-key
   ```

3. **Create terraform.tfvars:**
   ```bash
   cp terraform.tfvars.example terraform.tfvars
   # Edit terraform.tfvars with your values
   ```

4. **Initialize Terraform:**
   ```bash
   terraform init
   ```

5. **Plan deployment:**
   ```bash
   terraform plan
   ```

6. **Apply configuration:**
   ```bash
   terraform apply
   ```

## 📁 File Structure

```
terraform/
├── main.tf                 # Main Terraform configuration
├── variables.tf            # Variable definitions
├── terraform.tfvars.example # Example variables file
├── user_data.sh           # EC2 initialization script
└── README.md              # This file
```

## 🔧 Configuration

### Required Variables

- `database_password`: Secure database password for PostgreSQL
- `jwt_secret`: JWT secret for authentication
- `ssh_public_key`: SSH public key for EC2 access

### Optional Variables

- `aws_region`: AWS region (default: us-east-1)
- `ec2_instance_type`: EC2 instance type (default: t3.medium)

## 🗄️ Database Setup

PostgreSQL is automatically installed and configured on the EC2 instance:

- **PostgreSQL 15**: Latest stable version
- **Database**: `base44_test_management`
- **User**: `base44_user`
- **Port**: 5432 (localhost only)
- **Auto-start**: Enabled on boot

### Manual Migration (if needed)

```bash
# Connect to EC2
ssh -i ~/.ssh/base44-deployer-key.pem ubuntu@<EC2_PUBLIC_IP>

# Run migrations
cd /opt/base44-app
docker-compose exec backend npx prisma migrate deploy
```

## 🐳 Docker Deployment

The EC2 instance automatically:
1. Installs Docker and Docker Compose
2. Installs and configures PostgreSQL
3. Sets up the application directory
4. Creates systemd service for auto-start
5. Configures nginx reverse proxy
6. Sets up log rotation and monitoring

### Application Structure

```
/opt/base44-app/
├── .env                   # Environment variables
├── docker-compose.yml     # Production compose file
├── nginx.prod.conf        # Nginx configuration
└── logs/                  # Application logs
```

## 🔒 Security

### Security Groups

- **EC2**: SSH (22), HTTP (80), HTTPS (443)
- **PostgreSQL**: Local only (no external access)

### Best Practices

- Database runs locally on EC2
- Encrypted storage
- Automatic security updates
- Restricted access

## 📊 Monitoring

### Built-in Tools

- **htop**: System monitoring
- **Docker logs**: Container logs
- **Nginx logs**: Web server logs
- **PostgreSQL logs**: Database logs

### Log Locations

```bash
# Application logs
sudo journalctl -u base44-app.service

# Docker logs
docker-compose logs -f

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-*.log
```

## 🔄 CI/CD Integration

### GitHub Actions

The `.github/workflows/ec2-deploy.yml` workflow:
1. Runs tests
2. Builds Docker images
3. Pushes to ECR
4. Deploys to EC2

### Required Secrets

```bash
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
EC2_HOST=your_ec2_public_ip
EC2_SSH_KEY=your_private_ssh_key
DATABASE_PASSWORD=your_database_password
JWT_SECRET=your_jwt_secret
```

## 💰 Cost Optimization

### Instance Sizing

- **Development**: t3.micro (~$8/month)
- **Production**: t3.medium (~$30/month)
- **Database**: Included (no additional cost)

### Cost Saving Tips

1. **Local PostgreSQL** - No RDS costs (~$15/month saved)
2. **No Redis** - Simplified architecture for MVP
3. **Use Spot Instances** for non-critical workloads
4. **Implement auto-shutdown** for dev environments

## 🐛 Troubleshooting

### Common Issues

1. **SSH Connection Failed:**
   ```bash
   # Check security group
   aws ec2 describe-security-groups --group-ids <sg-id>
   
   # Verify key pair
   ssh -i ~/.ssh/base44-deployer-key.pem -v ubuntu@<IP>
   ```

2. **Docker Service Not Starting:**
   ```bash
   # Check service status
   sudo systemctl status base44-app.service
   
   # View logs
   sudo journalctl -u base44-app.service -f
   ```

3. **Database Connection Issues:**
   ```bash
   # Test PostgreSQL connection
   sudo -u postgres psql -c "\l"
   
   # Check PostgreSQL status
   sudo systemctl status postgresql
   ```

### Debug Commands

```bash
# Check system resources
htop

# View Docker containers
docker ps -a

# Check application logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Test nginx configuration
sudo nginx -t

# Check PostgreSQL
sudo -u postgres psql -c "SELECT version();"
```

## 🗑️ Cleanup

To destroy all resources:

```bash
terraform destroy
```

**Warning**: This will delete all data and resources!

## 📚 Additional Resources

- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [Docker Compose](https://docs.docker.com/compose/)
- [Nginx Configuration](https://nginx.org/en/docs/)
- [PostgreSQL Installation](https://www.postgresql.org/download/linux/ubuntu/)
- [AWS EC2 User Guide](https://docs.aws.amazon.com/ec2/)
