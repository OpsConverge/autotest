#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const { execSync } = require('child_process');
const path = require('path');

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Starting database migration process...');
  
  try {
    // Check database connection
    console.log('📡 Checking database connection...');
    await prisma.$connect();
    console.log('✅ Database connection successful');
    
    // Run Prisma migrations
    console.log('🔄 Running database migrations...');
    try {
      execSync('npx prisma migrate deploy', { 
        stdio: 'inherit',
        cwd: path.join(__dirname, '..')
      });
      console.log('✅ Database migrations completed successfully');
    } catch (error) {
      console.error('❌ Migration failed:', error.message);
      throw error;
    }
    
    // Generate Prisma client
    console.log('🔧 Generating Prisma client...');
    try {
      execSync('npx prisma generate', { 
        stdio: 'inherit',
        cwd: path.join(__dirname, '..')
      });
      console.log('✅ Prisma client generated successfully');
    } catch (error) {
      console.error('❌ Prisma client generation failed:', error.message);
      throw error;
    }
    
    // Check if we need to seed the database
    console.log('🌱 Checking if database needs seeding...');
    const userCount = await prisma.user.count();
    
    if (userCount === 0) {
      console.log('📝 Database is empty, running seed script...');
      try {
        execSync('node scripts/seed.js', { 
          stdio: 'inherit',
          cwd: path.join(__dirname, '..')
        });
        console.log('✅ Database seeded successfully');
      } catch (error) {
        console.error('❌ Seeding failed:', error.message);
        throw error;
      }
    } else {
      console.log(`✅ Database already has ${userCount} users, skipping seed`);
    }
    
    // Verify database schema
    console.log('🔍 Verifying database schema...');
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
    `;
    
    console.log('📊 Database tables found:', tables.map(t => t.table_name).join(', '));
    
    console.log('🎉 Database migration process completed successfully!');
    
  } catch (error) {
    console.error('💥 Database migration process failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Handle process termination
process.on('SIGINT', async () => {
  console.log('\n🛑 Migration process interrupted');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Migration process terminated');
  await prisma.$disconnect();
  process.exit(0);
});

main();
