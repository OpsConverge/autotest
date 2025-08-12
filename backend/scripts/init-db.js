#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const { execSync } = require('child_process');
const path = require('path');

const prisma = new PrismaClient();

async function initDatabase() {
  console.log('🚀 Initializing database...');
  
  try {
    // Check database connection
    console.log('📡 Checking database connection...');
    await prisma.$connect();
    console.log('✅ Database connection successful');
    
    // Reset database (WARNING: This will delete all data!)
    console.log('⚠️  Resetting database (this will delete all existing data)...');
    try {
      execSync('npx prisma migrate reset --force', { 
        stdio: 'inherit',
        cwd: path.join(__dirname, '..')
      });
      console.log('✅ Database reset completed');
    } catch (error) {
      console.error('❌ Database reset failed:', error.message);
      throw error;
    }
    
    // Run migrations
    console.log('🔄 Running migrations...');
    try {
      execSync('npx prisma migrate deploy', { 
        stdio: 'inherit',
        cwd: path.join(__dirname, '..')
      });
      console.log('✅ Migrations completed');
    } catch (error) {
      console.error('❌ Migrations failed:', error.message);
      throw error;
    }
    
    // Generate Prisma client
    console.log('🔧 Generating Prisma client...');
    try {
      execSync('npx prisma generate', { 
        stdio: 'inherit',
        cwd: path.join(__dirname, '..')
      });
      console.log('✅ Prisma client generated');
    } catch (error) {
      console.error('❌ Prisma client generation failed:', error.message);
      throw error;
    }
    
    // Seed database
    console.log('🌱 Seeding database...');
    try {
      execSync('node scripts/seed.js', { 
        stdio: 'inherit',
        cwd: path.join(__dirname, '..')
      });
      console.log('✅ Database seeded');
    } catch (error) {
      console.error('❌ Seeding failed:', error.message);
      throw error;
    }
    
    // Verify setup
    console.log('🔍 Verifying database setup...');
    const userCount = await prisma.user.count();
    const teamCount = await prisma.team.count();
    
    console.log(`📊 Database verification complete:`);
    console.log(`   - Users: ${userCount}`);
    console.log(`   - Teams: ${teamCount}`);
    
    console.log('🎉 Database initialization completed successfully!');
    
  } catch (error) {
    console.error('💥 Database initialization failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Handle command line arguments
const args = process.argv.slice(2);
const shouldReset = args.includes('--reset');

if (shouldReset) {
  console.log('⚠️  WARNING: This will delete all existing data!');
  console.log('Press Ctrl+C to cancel or any key to continue...');
  
  process.stdin.setRawMode(true);
  process.stdin.resume();
  process.stdin.on('data', (data) => {
    if (data[0] === 3) { // Ctrl+C
      console.log('\n❌ Operation cancelled');
      process.exit(0);
    }
    process.stdin.setRawMode(false);
    initDatabase();
  });
} else {
  initDatabase();
}

// Handle process termination
process.on('SIGINT', async () => {
  console.log('\n🛑 Database initialization interrupted');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Database initialization terminated');
  await prisma.$disconnect();
  process.exit(0);
});
