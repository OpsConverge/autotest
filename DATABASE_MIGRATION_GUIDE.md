# 🗄️ Database Migration Guide

This guide explains how database schemas are automatically migrated during deployment and how to manage them manually.

## 🔄 **Automatic Migration Process**

### **What Happens During Deployment**

1. **Database Container Starts**
   - PostgreSQL container initializes
   - Database is created if it doesn't exist
   - Health checks ensure database is ready

2. **Backend Container Starts**
   - Waits for database to be healthy
   - Connects to database using `DATABASE_URL`

3. **Migration Script Runs**
   - `scripts/migrate.js` executes automatically
   - Runs all pending Prisma migrations
   - Generates Prisma client
   - Seeds database if empty

4. **Application Starts**
   - Backend API becomes available
   - Frontend connects to backend
   - Nginx serves the application

### **Migration Files**

Your project has these migration files:
```
backend/prisma/migrations/
├── 20250728210351_init/                    # Initial schema
├── 20250729072120_add_workflow_run_id_unique/
├── 20250729080947_add_created_at_to_github_token/
├── 20250729082955_change_workflow_run_id_to_bigint/
├── 20250730170846_add_releases/            # Release management
├── 20250806013247_add_framework_field/     # Test framework support
├── 20250807033511_add_scheduled_tests/     # Scheduled testing
└── 20250807044828_add_workflow_run_id_to_scheduled_tests/
```

## 🛠️ **Manual Database Management**

### **Available Scripts**

```bash
# Run migrations only (safe for production)
npm run migrate

# Initialize fresh database (development only)
npm run init-db

# Reset database (WARNING: deletes all data)
npm run reset-db

# Seed database with test data
npm run seed
```

### **Manual Migration Commands**

```bash
# Check migration status
npx prisma migrate status

# Create new migration
npx prisma migrate dev --name your_migration_name

# Deploy migrations (production)
npx prisma migrate deploy

# Reset database (development)
npx prisma migrate reset

# Generate Prisma client
npx prisma generate

# View database in browser
npx prisma studio
```

## 🚀 **Deployment Scenarios**

### **First-Time Deployment**

When deploying to a fresh environment:

1. **Database is empty** → All migrations run
2. **Seed script executes** → Creates default users
3. **Schema is verified** → Confirms all tables exist

### **Subsequent Deployments**

When updating an existing environment:

1. **Only new migrations run** → Existing data preserved
2. **Seed script skips** → Users already exist
3. **Schema is verified** → Confirms no issues

### **Schema Changes**

When you add new features:

1. **Create migration locally:**
   ```bash
   npx prisma migrate dev --name add_new_feature
   ```

2. **Deploy to environments:**
   ```bash
   # Test environment
   ./scripts/quick-deploy.sh test YOUR_TEST_IP
   
   # Production environment
   ./scripts/quick-deploy.sh prod YOUR_PROD_IP
   ```

3. **Migration runs automatically** → New schema applied

## 🔍 **Verification Commands**

### **Check Database Status**

```bash
# Connect to database container
docker-compose exec postgres psql -U autotest_user -d autotest_test

# List all tables
\dt

# Check migration history
SELECT * FROM _prisma_migrations ORDER BY finished_at;

# Count records
SELECT 
  'users' as table_name, count(*) as count FROM users
UNION ALL
SELECT 'teams', count(*) FROM teams
UNION ALL
SELECT 'builds', count(*) FROM builds;
```

### **Check Migration Status**

```bash
# From backend container
docker-compose exec backend npx prisma migrate status

# Expected output:
# Database schema is up to date!
# 
# Applied migrations:
# 20250728210351_init
# 20250729072120_add_workflow_run_id_unique
# 20250729080947_add_created_at_to_github_token
# 20250729082955_change_workflow_run_id_to_bigint
# 20250730170846_add_releases
# 20250806013247_add_framework_field
# 20250807033511_add_scheduled_tests
# 20250807044828_add_workflow_run_id_to_scheduled_tests
```

## 🚨 **Troubleshooting**

### **Common Issues**

1. **Migration Fails**
   ```bash
   # Check database connection
   docker-compose exec backend npx prisma db pull
   
   # Reset and retry (development only)
   docker-compose exec backend npm run reset-db
   ```

2. **Schema Out of Sync**
   ```bash
   # Regenerate Prisma client
   docker-compose exec backend npx prisma generate
   
   # Push schema changes (development only)
   docker-compose exec backend npx prisma db push
   ```

3. **Seed Data Missing**
   ```bash
   # Run seed manually
   docker-compose exec backend npm run seed
   ```

### **Database Backup/Restore**

```bash
# Create backup
docker-compose exec postgres pg_dump -U autotest_user autotest_test > backup.sql

# Restore backup
docker-compose exec -T postgres psql -U autotest_user autotest_test < backup.sql
```

## 📊 **Database Schema Overview**

### **Core Tables**

- **`users`** - User accounts and authentication
- **`teams`** - Team/organization management
- **`team_members`** - User-team relationships
- **`team_settings`** - Team configuration
- **`github_tokens`** - GitHub integration

### **Testing Tables**

- **`builds`** - CI/CD build information
- **`test_runs`** - Individual test execution results
- **`scheduled_tests`** - Automated test scheduling
- **`releases`** - Software release management

### **Relationships**

```
User ←→ TeamMember ←→ Team
Team ←→ TeamSettings
Team ←→ GithubToken
Team ←→ Build ←→ TestRun
Team ←→ Release
Team ←→ ScheduledTest
```

## 🎯 **Best Practices**

### **Development**

1. **Always create migrations** for schema changes
2. **Test migrations locally** before deploying
3. **Use descriptive migration names**
4. **Backup data** before major changes

### **Production**

1. **Never run `migrate reset`** in production
2. **Test migrations** in staging first
3. **Monitor migration logs** during deployment
4. **Have rollback plan** for critical changes

### **Environment Management**

1. **Separate databases** for test/prod
2. **Use environment variables** for database URLs
3. **Regular backups** of production data
4. **Monitor database performance**

## 🎉 **Summary**

Your database migrations are **fully automated** during deployment:

- ✅ **Automatic migration execution**
- ✅ **Schema verification**
- ✅ **Data seeding when needed**
- ✅ **Rollback protection**
- ✅ **Environment isolation**

The migration process is **safe and reliable**, ensuring your database schema is always up-to-date across all environments!
